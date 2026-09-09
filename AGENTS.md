# AGENTS.md

Instructions for working on monochrome: an accessible, headless
UI component library with no runtime dependencies. Eight
components (Accordion, Collapsible, Dialog, Menu, Menubar,
Popover, Tabs, Tooltip), plus an optional router and thin
React and Vue wrappers. The core is framework-agnostic and
works on plain HTML; import it once and every correctly-
structured component on the page becomes interactive.

## Read first

- `PRINCIPLES.md`: the six north stars (DOM is the source of
  truth, event delegation on `window` only, zero timers, zero
  runtime dependencies, Baseline 2024, one file per component)
  and the shape choices that follow from them. Read it before
  touching `src/`. Breaking a north star is never a fix.
- `docs/`: how each mechanism works. Overlay files are
  `menu.md`, `popover.md`, `tooltip.md`, `dialog.md`. Shared
  helpers plus Accordion, Tabs, and Collapsible live in
  `dom.md`. Wrappers in `wrappers.md`. The core carries no
  comments; these files are its comments. Read the one for
  the component you are debugging, skip the rest.
- This file: how to work in the repo. Rules only.

## Where things go

Every change has exactly one home. Pick it before writing prose.

- A constraint that, if broken, means "not monochrome":
  `PRINCIPLES.md` › North stars. Needs the maintainer's sign-off.
- Why the core has a shape (a pattern, not a mechanism):
  `PRINCIPLES.md` › Why the core looks weird.
- How a component behaves, including every bug fix that changes
  behaviour: `docs/<component>.md`, inside the paragraph that
  owns that mechanism. Accordion, Tabs, Collapsible, and shared
  helpers live in `docs/dom.md`.
- Wrapper-only behaviour (React, Vue): `docs/wrappers.md`.
- Router behaviour: TSDoc in `src/router.ts`, never markdown.
- How code is written (style, naming, order): this file ›
  Code style, as a rule.
- Toolchain, build, gate: this file › Build pipeline.
- Test naming or structure: this file › Test naming.
- What a component does for consumers: `README.md`.

Writing a mechanism paragraph in `docs/`:

- One mechanism per paragraph, with a bold lead that names it.
  First sentence states the behaviour, then the why, then the
  edge cases. A paragraph past fifteen lines is two mechanisms;
  split it.
- Edit the paragraph that owns the mechanism. Never append a
  sentence to the nearest paragraph because it was open.
- Every fact once. When a second paragraph needs it, cross-
  reference (`see docs/popover.md`) instead of restating.
- Present tense, declarative: what the code does now. Never what
  it used to do, or which commit changed it.
- Identifiers only where a reader would grep for them, and only
  identifiers that exist in `src/`. Renaming code renames the
  doc in the same commit.
- Prose style below applies: no em dashes, hard wrap at 66-70.

Writing in this file:

- Rules, not rationale. If a rule needs a why, the why is a
  mechanism (`docs/`) or a principle (`PRINCIPLES.md`); link it.
- Two lines per rule where possible, at most one identifier as
  an example. Example lists rot on the next rename.
- Under 350 lines. When a section outgrows that, something in it
  is a mechanism and belongs in `docs/`.

## Code style

Rules only. Rationale lives in `PRINCIPLES.md`; mechanisms live
in `docs/`.

### Formatting

- oxfmt defaults (`.oxfmtrc.json`, no overrides beyond ignoring
  `.html`/`.vue`/`.css`): 2-space indent, semicolons, double quotes,
  80-char line width. oxlint (`.oxlintrc.json`) runs the
  `correctness` category with the `typescript`, `unicorn`, and
  `oxc` plugins. `bun run lint` runs
  `oxlint` then `oxfmt --check`, covering both lint and format, and
  runs first in the pre-commit hook.
- `.js` extensions on value imports (NodeNext resolution).

### Functions

- Arrow functions in the core and router. React wrappers use
  `function` declarations for components (React convention, better
  stack traces). Vue wrappers use `defineComponent` with
  method-shorthand `setup`. Menu's item components come
  from one factory in both wrappers (`docs/wrappers.md`).
- Enum-typed mode parameters instead of option objects when
  the set is small: `menu(trigger, mode: Focus)`.
- No optional parameters that every caller supplies, and no
  return values that no caller reads. Signatures are the
  contract; unused generality is negative value here.
- Extract a helper at the second verbatim repetition of a
  multi-line pattern when it saves minified bytes
  (`menuTrim`).

### Control flow

- Nest over early-return. One top-level guard is fine; chained
  returns fragment the function's shape.
- `while` over `for` for DOM walks. Sibling-pointer advancement
  (`el = el.nextElementSibling`), never counters or indices.
- `for...of` over `.forEach` for arrays. `.forEach` is fine on a
  `NodeListOf`.
- `switch` for keyboard dispatch.
- Ternary for values, not statements: `x = c ? a : b` is fine, but
  an expression-statement ternary (`c ? f() : g()`) trips oxlint's
  `no-unused-expressions`. Use `if`/`else` for side-effect branches.
- `array[0]` over `array.length > 0`.
- `||` for element fallbacks, never `??`: an element is never
  falsy-but-valid, and one operator keeps the grep simple.
- `=== true` only where TypeScript needs a boolean (type
  predicate returns); rely on truthiness everywhere else.

### DOM access

- No `querySelector` / `querySelectorAll` in the core. Walk
  `firstElementChild` / `nextElementSibling` / `parentElement` by
  hand. (The router uses `querySelectorAll` once, for a named-region
  lookup where no sibling relationship exists.)
- No `closest()`. Use `findAncestor(el, prefix)`.
- ARIA IDL accessors (`ariaExpanded`, `ariaChecked`,
  `ariaDisabled`, `ariaSelected`, `role`, `hidden`) over
  `getAttribute`/`setAttribute`. String API only where there's no
  IDL counterpart (`data-*`, `aria-labelledby`, `aria-controls`).
- Hidden content carries `hidden`, or is a closed popover or
  `<dialog>`. Never write `aria-hidden`: each already drops the
  subtree from the accessibility tree, so the attribute would be a
  second copy of the same state.
- Compare ARIA strings with `!== "true"` when the "not truthy"
  case is the one you care about.

### State

- File-scope `let`, inside the `hasDocument` guard, for mutable
  state shared between handlers; file-scope `const` for
  structures (stacks, maps, parsers).
- No classes, no `this`, no closures-over-state threaded through
  call chains.
- `should*` flags drive cross-handler signalling within a single
  event cycle.

### Types

- Enums for related string constants (`Prefix.TriggerMenu`,
  `Focus.First`). Numeric enums for mode-select flags, string
  enums for stable identifiers that appear in the DOM.
- Named-tuple types for 2-3 field shapes that stay file-private:
  `type Fetched = [html: string, url: string]`.
- Type guards as `is`-predicates (`isElement`, `isTrigger`,
  `isMenuItem`, `canHandle`). Narrow once at the listener entry;
  pass the narrowed value down.
- No `as`, `any`, or non-null `!` assertions in the core or
  router. Narrow with runtime checks. (Vue wrappers may use `as
PropType<...>` where Vue's prop typing requires it.)

### Events

- `addEventListener` on `window` only. Listeners are never
  removed.
- Custom events (`mc:navigate`) for cross-boundary signals the
  wrappers need. No callback props or event-emitter exports from
  the core.
- `void` on fire-and-forget promise expressions.

### Naming

- Core primitives are named after the component they drive:
  `accordion`, `collapsible`, `dialog`, `menu`, `popover`,
  `tabs`, `tooltip`. Helpers extend the primitive with a verb:
  `menuOpen`, `menuCloseAll`, `dialogClose`, `tooltipSync`.
  Shared DOM writes that are not a component (`toggleDisclosure`,
  `position`) live in `src/dom.ts` and take no component name.
- Open/close is the verb pair for named actions (it matches
  `aria-expanded`). Show/hide appears only as the boolean
  parameter of the primitives that map straight onto
  `showPopover`/`hidePopover`: `popover(trigger, show)`.
- A component's name belongs to that component alone: nothing
  menu-related is called `popover*`. Derived names reuse the
  component name verbatim, plural included (`tabsNext`, never
  `tabNext`).
- `should*` for driver flags, `safe*` for safety-triangle state,
  `tooltip*` for tooltip state, `menu*` for menu state.
- Boolean flags are plain `boolean` reset to `false`;
  value-carrying flags are `T | null` with null meaning "off".
- Local booleans read as predicates or adjectives (`isOpen`,
  `wasOpen`, `vertical`, `safe`). `is*` is current DOM state;
  `will*` is the computed next state (`willOpen`, `willSelect`).
  Never a boolean named like an element, or an element used as
  a flag under a boolean-ish name.
- `el` is a moving walk cursor; `target` is the fixed element
  derived from `event.target`; `trigger`/`content` are the
  resolved pair. Other short locals only where the type carries
  the meaning: `item`, `rect`, `id`.
- Single-letter names only for the loop index `i` and the
  interpolation parameter `t`.
- Type aliases and their implementations use the same parameter
  names (`node`, `origin`, `fallback`).

### Sorting

Alphabetical is the house order; a new entry has exactly one
correct place. It applies to:

- Enum members. Family checks (`Content`, `Trigger`) sort in
  with their specifics and land first automatically.
- File-scope state, alphabetical within its blank-line group.
  Groups in order: driver flags, generic state, then one group
  per component, components alphabetical.
- Type guards, generic helpers, roving callbacks, component
  clusters, and the functions within a cluster.
- Dispatch chains (`else if` prefix ladders). One exception: a
  check that must short-circuit the ladder stays first
  (`docs/menu.md`, "Walks break on `mct:menu:`").

Fixed, non-alphabetical orders that stay fixed:

- Listeners register in the north-star event order: pointerdown,
  pointerup, click, pointermove, keydown, scroll, resize,
  focusin, focusout.
- `switch` cases on keys: `Enter`, `" "`, `Tab`, `ArrowDown`,
  `ArrowUp`, `ArrowRight`, `ArrowLeft`, `Home`, `End`, then
  `default`. Skip keys the component does not handle.
- CSS custom properties: trigger rect in TRBL order (`--top`,
  `--right`, `--bottom`, `--left`), then content size
  (`--width`, `--height`).
- `Focus` enum: `Trigger` first (`0`), then semantic order.

## Prose style

Applies to all prose in the repo: code comments, TSDoc, README,
PRINCIPLES.md, AGENTS.md, `docs/`, commit messages, PR
descriptions.

- **No em dashes (`—`).** Use a period, colon, semicolon, or
  parentheses instead. oxlint doesn't lint prose, so this is on the
  author. The rule applies everywhere, including stripped-at-build
  comments (the source is still what humans read).
- **Hard-wrap around 66-70 characters.** Purely an authoring
  convention; Markdown renderers ignore the line breaks. It keeps
  diffs one-line-per-change instead of full-paragraph reflows, and
  lets prose sit next to TSDoc blocks (wrapped at the same width)
  without a visual seam. Applies to every file listed above.

## Comment policy

- Core (`src/dom.ts`, `src/index.ts`, each `src/{component}.ts`):
  **no comments.** Behaviour lives in `docs/` (Where things go)
  and rationale in `PRINCIPLES.md`, never in the source. When a
  mechanism needs explaining, explain it there.
- `src/router.ts`: **fully commented.** TSDoc (`/** */`) for
  every declared symbol. Inline `//` for non-obvious decisions.
  File-top `@file` header explaining architecture, invariants,
  and file layout.
- `src/react/*`, `src/vue/*`: **no comments** except
  `// oxlint-disable-next-line` pragmas where required. Each file is
  small and self-evident.
- Tests: no comments except when the _why_ of a setup step would
  surprise the next reader (race conditions, sentinel globals, etc.).

Rolldown's minifier drops all comments from `dist/`, so the
router's comments never reach the published bundles.

## Build pipeline

`bun run build` (`bun build.ts`) lints, bundles to `dist/` with
rolldown, emits `.d.ts` via `tsc`, and rewrites `package.json`'s
`versionMeta` from the current source: `gzipSize` is the combined
core (headline / badge), `gzipSizes` has one entry per export
(each component plus `index` and `router`), each an object with
a gzip number per published flavour (`core` / `react` / `vue`;
`router` is core-only), and `tests` is Playwright counts. The
numbers are generated, never hand-edited. Dist bytes match a Node
build of the same tree; `gzipSync` numbers can differ by a few
bytes from Node's zlib, so the gate always restamps from Bun.

**Requires Bun >= 1.4.** `build.ts` and the SSR test server
(`tests/server.ts`) are run directly as TypeScript. CI pins
`1.4.2` via `.bun-version`; the published package itself has no
runtime Bun or Node requirement (it ships browser ESM), which
is why there is no `engines` field constraining consumers.
Install with `bun install` (`bun.lock`); do not add a
`package-lock.json`. This tree is self-contained: when nested as
a docs-site submodule, the parent links it via `file:` rather
than as a workspace member, so `bun install` here owns its own
`node_modules` and lockfile.

**Every commit runs the full gate.** The pre-commit hook runs
lint, typecheck, build, and the complete test suite, then stages
the restamped `package.json`. Never bypass it with `--no-verify`,
and never defer the `versionMeta` rewrite to a later commit: every
commit must carry the sizes and test counts produced by its own
tree, so any checkout of any commit reports honest numbers. This
applies to multi-commit series too; run the gate once per commit,
not once at the end.

## Test naming

The describe block already names the subject; the test name should
state the behaviour, nothing else.

- **Imperative present tense, no `should`.** `opens on Enter`, not
  `should open on Enter`. The describe block already says "this is
  the Menu Activation spec"; the `should` is a redundant aspiration.
- **Subject is the protagonist of the assertion.** Use the SUT when
  the test is about a property (`declares aria-haspopup="menu"`).
  Use the input when the test is action-driven (`Enter opens the
menu`).
- **No filler.** Drop `test that`, `ensure`, `verify`, `make sure`,
  `correctly`, `properly`, `as expected`. If the assertion exists,
  the behaviour IS the expected one.
- **Backticks for kebab-case attributes and ambiguous tokens.**
  `aria-expanded`, `role="menu"`, `Tab` (the
  key, to disambiguate from the noun) always quoted with backticks.
  PascalCase key names (`Enter`, `ArrowDown`, `Home`, `End`) are
  visually distinct enough that backticks are optional, but be
  consistent within a single test name.
- **One sentence, sentence-case, no trailing period, ≤80 chars.**
  Code identifiers keep their casing.
- **Describe blocks use a fixed vocabulary** so the same
  capability has the same name in every component spec: `ARIA`,
  `Initial state`, `Activation`, `Keyboard`, `Mouse`,
  `Focus management`, `Dismissal`, `Modality`, `Disabled`,
  `Nested`, `Multiple`, `Composition`, `Scroll prevention`,
  `Positioning`, `Structure independence`, `Click handler`,
  `Dynamic`, `Edge cases`. `Nested` is the component inside
  itself. `Composition` is the component used with another one
  (adjacent or nested inside it). `Multiple` is independent
  instances on one page. `Dismissal` is closing by anything
  other than the trigger. `Modality` is blocking background
  interaction while open.
- **A slice of one term appends a parenthesised qualifier**:
  `Keyboard (RTL)`, `Mouse (safety triangle)`,
  `Composition (dialog)`. No other describe names. The component
  describe itself (`Menu`, `Menubar`) and the non-component specs
  (router, SSR, axe, architecture) sit outside the vocabulary.
