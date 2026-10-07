# AGENTS.md

Instructions for working on monochrome: an accessible, headless
UI component library with no runtime dependencies. Eight
components (Accordion, Collapsible, Dialog, Menu, Menubar,
Popover, Tabs, Tooltip), plus an optional router and the React
and Vue component templates that `npx monochrome add` copies
into projects (`templates/`). The core is framework-agnostic and
works on plain HTML; import it once and every correctly-
structured component on the page becomes interactive.

## Read first

- `PRINCIPLES.md`: the six north stars (DOM is the source of
  truth, event delegation on `window` only, zero timers (one paint
  yield in the router), zero
  runtime dependencies, Baseline 2024, one file per component)
  and the shape choices that follow from them. Read it before
  touching `src/`. Breaking a north star is never a fix.
- `docs/`: how each mechanism works. Overlay files are
  `menu.md`, `popover.md`, `tooltip.md`, `dialog.md`. Shared
  helpers plus Accordion, Tabs, and Collapsible live in
  `dom.md`. Router in `router.md`. React and Vue parts in
  `parts.md`. The core and router carry no comments; these files are
  their comments. Read the one for the component you are
  debugging, skip the rest.
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
- Behaviour of the parts beyond markup: `docs/parts.md`.
- React parts: `templates/react/<component>.tsx` (JSX). Vue parts:
  `templates/vue/<component>/`, one single-file component per part,
  a `context.ts` for what they share, and an `index.ts` that loads
  the core and names the parts. Both are listed in
  `templates/manifest.json`. Users own their copies, so they stand
  alone: each component imports its core as `monochrome/<component>`
  and inlines its helpers. Imports between template files are
  relative and extensionless (`./menu`, `../menu/context`), the one
  exception to the `.js` rule. The React and Vue fixtures render
  these files (`@/components/ui`). The package has no framework
  export.
- Every part carries `data-slot` (after the props spread), a
  styling hook, and passes a class to its element.
- No CSS ships: not in `dist/`, not from `add`. Each spec's Styling
  section is how a project styles the component (below).
- `templates/manifest.json` is the one list of components: the
  build, the CLI, the tests, and the website read it. Each entry
  names what it requires, whether its spec has Required CSS
  (`placement`, checked by the build), and its own files per
  framework.
- `build.ts` turns the templates into the files `add` copies:
  `dist/files/react/`, `dist/files/vue/`, `examples/`, and a
  `manifest.json` (`scripts/files.ts`). Every `.tsx` part and
  example gets a type-stripped `.jsx` twin, which `add` writes in a
  project without a `tsconfig*.json`; TypeScript the stripper
  misses fails the build. The Vue parts ship as written
  (`lang="ts"`, which Vue's tooling compiles in any project).
  The CLI never generates; it copies. Each file's first line names
  the version it came from. `monochrome.json` holds only settings
  (framework and the components folder); there is no `update`
  command yet.
- Frameworks: `cli/frameworks.ts` has one entry per framework
  `add` writes for. `html` (the default without React or Vue)
  prints the spec's Anatomy markup; `react` and `vue` write the
  parts. A new framework is one entry there, its files in
  `templates/<id>/` listed in the manifest, an example per
  component in `templates/<id>/examples/`, a build step in
  `scripts/files.ts`, a Playwright project with its fixtures, and
  the same CLI tests run for it.
- `add` and `init` keep the core in lockstep: they install
  `monochrome` at the CLI's own version when the project lacks it,
  and stop before writing when the project resolves another version
  (`cli/install.ts`).
- Router behaviour: `docs/router.md`.
- How code is written (style, naming, order): this file ›
  Code style, as a rule.
- Toolchain, build, gate: this file › Build pipeline.
- Test naming or structure: this file › Test naming.
- What a component does for consumers: `README.md` for the
  overview, `spec/<component>.md` for the markup contract.

Writing a mechanism paragraph in `docs/`:

- One mechanism per paragraph, with a bold lead that names it.
  First sentence states the behaviour, then the why, then the
  edge cases.
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
- At most one identifier as an example. Example lists rot on the
  next rename.

## Agent layer: `spec/`, `skills/`, `cli/`, `CHANGELOG.md`

Consumer-facing files that ship in the package next to `dist/`.
None of them is imported by `src/`, and none may be.

- `spec/`: the consumer markup contract, one file per component
  plus `conventions`, `styling`, `router`, `choosing`. It ships in
  the package for agents to read, and is the single source for the
  Anatomy markup `add` prints and for the website, whose demos wear
  each spec's Styling CSS. It is framework-free: the framework
  examples `add` prints live with their parts, in
  `templates/<framework>/examples/`.
- Keep `spec/` in sync with `src/`: a behaviour change updates the
  spec paragraph, table row, or snippet in the same commit, and
  every claim in it is checked against the code or a test.
- Keep component files in the fixed section order (Anatomy, Parts,
  Contract, Keyboard, optional Pointer and Dismissal, Styling,
  Accessibility, Design choices, Common mistakes); the CLI
  and site read sections by heading. Design choices lists the
  deliberate deviations from APG and the opinions behind the
  behaviour, each with its reason, so nobody "fixes" them; choices
  every component shares live in `conventions.md`.
- `spec/` is compiled as MDX: YAML frontmatter (`title`,
  `description`) only, no HTML comments, no raw `<`, `>`, `{`, `}`
  outside code, no inline code broken across lines, links as
  `[Popover](popover.md)`.
- `skills/monochrome/SKILL.md`: the agent skill.
  Opt-in (`npx skills add`); `init` never writes it. `init` only
  upserts a short marked block in the project's `AGENTS.md`.
- `cli/`: the `npx monochrome` CLI, bundled by `build.ts` into
  `dist/cli.js` for Node 20: `init`, `add`, `docs` (prints a
  `spec/` page), and `changelog` (prints `CHANGELOG.md` entries
  by version). Results go to stdout, progress to stderr; `init`
  and `add` take `--json` (one JSON document on stdout, the
  result or the error) and `--dry-run`. Zero installed
  dependencies: a helper is a devDependency inlined by the bundle.
  No telemetry. The React examples typecheck against the templates
  (`tsconfig.json` maps `@/components/ui/*`); the Vue templates and
  examples are covered by the Vue fixtures instead. There is no checker:
  agents verify rendered HTML against `spec/conventions.md`
  (Verify) and each component's Contract and Common mistakes, so a
  contract change updates those in the same commit.
  `tests/cli/` runs the built `dist/cli.js` in throwaway projects
  with a fake package manager on PATH: `bun run test:cli`, after a
  build.
- `CHANGELOG.md`: every release, newest first. It ships in the
  package for `npx monochrome changelog`, and the website renders
  it at /docs/changelog, so it follows the `spec/` MDX rules
  minus frontmatter. A user-visible change adds a bullet under
  `## Unreleased` in the same commit, in the fixed subsection
  order: Upgrade, Breaking, Added, Changed, Fixed, Removed (empty
  ones left out). A change that makes consumers edit code gets an
  Upgrade step with before/after code; write each step so an agent
  can apply it without reading the diff. Headings stay
  `## <version> (<date>)`: the CLI reads versions from them. The
  release workflow renames Unreleased to the version and date, and
  stops before publishing when it is missing or empty.
- Styling: monochrome ships no CSS. A component's `## Styling`
  section is its how-to-style doc: the hooks it exposes, then for
  Menu, Popover, and Tooltip a `### Required` fence (placement and
  the fixes for the core's own side effects, nothing of a look, in
  `@layer components`, copied into projects as it is), then an
  `### Example` fence that styles every state in plain CSS for
  projects to adapt. Required is the only CSS a component needs to
  work: anything a project could style its own way belongs in
  Example. Size in `em`; derived values (offset, inset, height cap)
  are private `--_*` properties on the surface. Never set
  `color-scheme` (the page does). The website's demos and the
  placement tests wear both fences, read from the spec.

## Code style

Rules only. Rationale lives in `PRINCIPLES.md`; mechanisms live
in `docs/`.

### Formatting

- oxfmt defaults (`.oxfmtrc.json`, no overrides beyond ignoring
  `.html`/`.css`): 2-space indent, semicolons, double quotes,
  80-char line width. oxlint (`.oxlintrc.json`) runs the
  `correctness` category with the `typescript`, `unicorn`, and
  `oxc` plugins. `bun run lint` runs
  `oxlint` then `oxfmt --check`, covering both lint and format, and
  runs first in the pre-commit hook.
- `.js` extensions on value imports (NodeNext resolution).

### Functions

- Arrow functions in the core and router. React templates use
  `function` declarations and JSX for components (React convention,
  better stack traces). Menu's item components share one `useRow`
  helper (`docs/parts.md`). Vue templates are single-file
  components with `<script setup lang="ts">`; menu's items share
  one `Row.vue`.
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
  router. Narrow with runtime checks.

### Events

- `addEventListener` on `window` only. Listeners are never
  removed.
- Custom events (`mc:navigate`) for cross-boundary signals page
  code needs. No callback props or event-emitter exports from the
  core.
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
- CSS custom properties: trigger rect in TRBL order
  (`--mc-trigger-top`, `--mc-trigger-right`, `--mc-trigger-bottom`,
  `--mc-trigger-left`), then content size (`--mc-content-width`,
  `--mc-content-height`), then `--mc-available-height`.
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

- Core (`src/dom.ts`, `src/index.ts`, each `src/{component}.ts`)
  and the router (`src/router.ts`): **no comments.** Behaviour
  lives in `docs/` (Where things go) and rationale in
  `PRINCIPLES.md`, never in the source. When a mechanism needs
  explaining, explain it there.
- `templates/react/*`: **no comments.** Projects own these files
  and keep them as their own code; the only comment is the header
  the build stamps (`// monochrome@<version> <file>: yours to
  edit.`). Why a part, helper, or import does more than its markup
  shows goes in `docs/parts.md`.
- Tests: no comments except when the _why_ of a setup step would
  surprise the next reader (race conditions, sentinel globals, etc.).

## Build pipeline

`bun run build` (`bun build.ts`) bundles to `dist/` with
rolldown, emits `.d.ts` via `tsc`, and rewrites `package.json`'s
`versionMeta` from the current source: `gzipSize` is the combined
core (headline / badge), `gzipSizes` has one entry per export
(each component plus `index` and `router`), each `{ core }`: the
gzip bytes that entry pulls in. The numbers are generated, never
hand-edited. Dist bytes match a Node build of the same tree;
`gzipSync` numbers can differ by a few bytes from Node's zlib,
so the gate always restamps from Bun.

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

**Every commit restamps `versionMeta`.** The pre-commit hook
runs lint, build, and typecheck, then stages the restamped
`package.json`. Never `--no-verify` locally; the release
workflow is the exception after CI. Never defer the rewrite.

**Browser floors live in `browserslist`.** One list per target
(`core`, `router`), each entry `<browser> >= <version>`, Chrome
then Safari then Firefox. `bun run support` (also part of every
build) resolves the web APIs the source touches against MDN's
browser-compat-data and fails when a target reaches past its
floor, naming the API. Raising a floor is a deliberate
`browserslist` edit. Release dates for those versions are in
the README and `docs/router.md`. The gate knows whether an API
exists, never how it behaves, and the suite runs current
browsers rather than old ones: a support claim is checked by
reading the code, a regression by running what people are on.

`bun run test` is Chrome (`html`, `react`).
`bun run test:cli` is the CLI suite (Node, no browser).
`bun run test:all` is the four-project matrix CI runs on
the PR: Chrome, Safari, and Firefox. `bun run test:install`
fetches Chrome; `test:install:all` fetches all three. Do not
postinstall browsers. `prepare` sets hooks only in a git
work tree.

CI `quality` fails if `package.json` drifts from the
restamp and uploads `dist` for the browser jobs. The
required check is `ci`. Open a pull request against
`main`; the pre-push hook blocks direct pushes unless
`CI` is set. Only the release workflow pushes to `main`,
through the `RELEASE_DEPLOY_KEY` write deploy key. Ruleset
on `main`: block force pushes and deletions, require a
pull request (0 approvals), require `ci` and an up-to-date
branch. Deploy keys are the only bypass; GitHub does not
allow the Actions app as a bypass actor on a user-owned
repo.

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
