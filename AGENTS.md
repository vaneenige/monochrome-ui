# AGENTS.md

Instructions for working on monochrome: an accessible, headless
UI component library with no runtime dependencies. Eight
components (Accordion, Collapsible, Dialog, Menu, Menubar,
Popover, Tabs, Tooltip), plus an optional router and thin
React and Vue wrappers. The core is framework-agnostic and
works on plain HTML; import it once and every correctly-
structured component on the page becomes interactive.

## North stars (non-negotiables)

These aren't preferences. Break any of them and it isn't monochrome
any more:

1. **DOM is the source of truth.** Every decision reads
   `aria-expanded`, `aria-selected`, `aria-checked`, `aria-hidden`,
   `aria-disabled`. There is no internal state object mirroring the
   DOM anywhere in the library.
2. **Event delegation only.** Nine global listeners in the core:
   `pointerdown`, `pointerup`, `click`, `pointermove`, `keydown`,
   `scroll`, `resize`, `focusin`, `focusout`. Zero per-element
   listeners.
3. **Zero timers.** No `setTimeout`, `requestAnimationFrame`,
   `queueMicrotask`, debounce, or throttle. Every action is
   synchronous within its event.
4. **Zero runtime dependencies.** The core imports nothing. The
   wrappers import only their framework (as peer deps).
5. **Baseline 2024 browsers.** We rely on the Popover API. No
   polyfills shipped.
6. **The core is one file.** `src/index.ts`. Don't split it. The
   whole-file view is what makes the event-delegation logic
   reviewable.

## Why the core looks weird (and should stay weird)

Six architectural choices that explain the *shape* of the library.
Each looks odd at a glance and each has a specific reason. Don't
"fix" them.

**DOM-as-state.** Reading ARIA attrs on every event looks wasteful
compared to caching in a JS object. It isn't: the cache would drift
the moment a user, a framework, or devtools mutates the DOM, and
tracking who owns what becomes a maintenance tax. With DOM-as-state
there is exactly one truth and we never have to reconcile.

**Global delegated listeners.** Per-component listeners scale with
component count and require teardown on unmount. Nine global
listeners are constant cost, require zero teardown, and automatically
cover dynamically-inserted DOM without re-wiring.

**ID prefix dispatch.** We route events to handlers by checking the
prefix of `target.id` (`mct:`, `mcc:`, `mcr:`). No classes, no data
attributes, no registration table. Enum values spell out the full
component name with a trailing colon (`mct:accordion:`,
`mct:dialog-open:`), exactly as the ids appear in the DOM.

**Module-level `let` for state.** No classes, no `this`, no closures
passed down. Handlers share state through module-scope variables
(`menuStack`, `popoverShown`, `tooltipShown`, …). This is why the
core is one file: the state is part of the file's mental model.

**`should*` driver flags for cross-handler communication.** The
conventional move is to thread a mutable parameter (or return a
result object) through every function the event visits, so each
layer can report "I want preventDefault", "I matched a letter",
"I'm doing a radio sweep" back up. The core skips all of that:
flags like `shouldPreventDefault`, `shouldMatchLetter`, and
`shouldResetRadio` live at module scope. A deep callback sets one
during event processing; the top-level listener reads and clears
it at the tail. No parameter plumbing, no return-value threading,
no wrapper objects. It looks unconventional because shared mutable
state usually is, but every flag's lifetime is bounded by a single
synchronous event cycle (cleared at the top of each listener), so
there's no reentrancy to reason about. Saves real bytes on every
function signature it removes, and it makes the "where does this
side effect come from?" question one grep away.

**Wrappers use `createElement` / `h`, not JSX / SFC.** Eliminates
`react/jsx-runtime` from the React bundle and halves the Vue bundle
(no SFC patch-flag machinery). Source stays framework-agnostic in
style.

## Clever tricks

Specific mechanisms inside the core and router. Read this section
when you're debugging a particular behaviour; skip it when you just
want the architecture.

**`while` with sibling pointers, not `querySelectorAll`.** Every
DOM walk in the core is a hand-rolled loop: `let item =
root.firstElementChild; while (item) { ...; item =
item.nextElementSibling }`. `querySelectorAll` would allocate a
NodeList and run a selector parser for structure we already know
(Accordion items are direct children of the root; Tab buttons are
direct children of the List). A sibling-pointer walk costs
nothing, makes iteration order explicit (single-mode Accordion
needs close-before-open, Tabs toggles off-and-on in one pass), and
lets a single traversal do work that a list plus follow-up would
split in two.

**Walk-up then walk-down for click dispatch.** The click listener
walks UP from the event target (`target = target.parentElement`)
until it finds a recognised ID prefix. Menu open/dismiss lives on
`pointerdown` and item activation on `pointerup`; click still
dispatches the other components and is skipped entirely when
`shouldSuppressClick` is set (a menu pointer session owns that
gesture). The fall-through case (walk reached the document root
without matching) is the outside-click detector for popovers.

**`findAncestor` over `closest()`.** `findAncestor(el, prefix)`
walks `parentElement` up checking `id.startsWith(prefix)`.
`closest(".foo")` would require classes or data attributes, which
is the exact shadow registry the ID-prefix scheme exists to avoid.
The manual walk is fewer bytes, inlines into a single loop, and
doesn't pull in the CSS selector engine.

**Array-as-nullable-stack.** `menuStack[0]` is "is any menu
open?", `menuStack[1]` is "is a submenu open?",
`menuStack.pop()` closes the topmost. No `.length` check, no
parallel `openMenu: HTMLElement | null` variable, no wrapper type.
One array doubles as flag, stack, and cursor.

**Roving-boundary sentinel.** A generic sibling walker can't
distinguish "walked past the end and wrapped" from "kept going
past the start". On an all-disabled list the naive walker loops
forever. `rovingBoundary` remembers the first candidate the walker
rejected; if we ever see it again we give up. One pointer, zero
counters, zero extra passes. Cleared at the top of every
`keydown`, `click`, and `pointerup` (all three listeners drive
walks) so each interaction starts with a fresh boundary.

**Radio sweep reuses the navigation walker.** Activating a
`menuitemradio` must clear `aria-checked` on every adjacent radio
up to the group boundary. Instead of writing a dedicated sweep,
`menuActivate` sets three module flags (`shouldResetRadio`,
`radioHeadDone`, `radioTailChain`) and calls the same `menuNext`
used for ArrowDown. `menuRoving` notices the non-null driver state
and switches into sweep mode: clear radios in the "head" half,
buffer them past the wrap, flush the tail once the activated item
is reached. One engine, three behaviours (plain roving, typeahead,
radio sweep), selected by which module-scope flag is non-null.

**Menu Enter/Space in `keydown`.** Accordion, Tabs, and the other
triggers still rely on the browser's synthesized `click` for
Enter/Space. Menu cannot: `pointerdown` already opened or
dismissed the menu, and the following click is suppressed via
`shouldSuppressClick`. Keyboard activation therefore lives in
`keydown` (`menuOpen` / `menuActivate`) with `preventDefault`
so Space does not scroll. Enter on an href menuitem is the
exception: no `preventDefault`, so the synthesized `click`
navigates and the click listener closes the menu.

**Pointer session and `shouldSuppressClick`.** A menu gesture is
a pointer session, not a click. `pointerdown` on a trigger opens
or toggles; `pointerdown` outside dismisses; `pointerup` on a
plain menuitem activates. Non-primary buttons (`button !== 0`)
are ignored. After a menu `pointerdown`, `shouldSuppressClick`
makes the trailing `click` a no-op so a press that started on
the menu cannot also toggle a disclosure (or anything else)
underneath. Playwright `.click()` still works: it fires
`pointerdown`.

**Popover API with CSS-variable positioning.** The core publishes
the trigger rect (`--top`, `--right`, `--bottom`, `--left`, in
TRBL order) and the content's own size (`--width`, `--height`)
as CSS custom properties on the content element. All positioning
happens in CSS. No JS layout math, no `z-index` management (top
layer handles that).

**Safety triangle in JS.** When a submenu is open, pointermove
records the last cursor point inside the topmost open submenu
trigger (the apex). Later moves skip hover activation while the cursor is
inside the triangle from that apex to the submenu's near
vertical edge (`clamp(left, apexX, right)` as the base) and
still moving toward the submenu. A failed test (left the
path, or arrived in the submenu where `t > 1`) clears the
apex; hover the trigger again to re-arm. Pointermove focuses the
enabled item under the pointer (React Aria / Base UI) so Arrow
keys continue from there; `data-highlighted` follows that item.
Disabled items, labels, and separators clear the paint only.
They do not steal focus. CSS `:hover` is not enough: a
press-and-drag leaves the trigger `:active`, so `:hover` on
items never fires. Triangle travel still skips open/close. No
overlay, no CSS vars, no timers. Hover can leave focus inside
the popover. A `Focus.None` close focuses the trigger first
when the active element is inside the content, so
`hidePopover` never drops a focused node that lives in the
menu. Enter on an href does not activate in `keydown`; the
synthesized `click` both navigates and closes.

**Signed movement for triangle direction.** "Is the cursor
moving toward the submenu?" is
`(submenuLeft - triggerRight) * event.movementX >= 0`.
Submenu to the right: `left - right` is positive, so the
product stays non-negative while `movementX >= 0` (moving
right). Submenu to the left: inverted, same expression. One
signed multiplication covers both sides without a branch.
The submenu popover is resolved live from the topmost
trigger's `aria-controls` while testing the triangle, and
its rect is measured then, not at open time: stale state
cannot survive a close, and `@starting-style` transforms
leave the rect wrong until the animation settles anyway.

**RTL by mirroring the key, once.** Horizontal arrows are
spatial: with `dir="rtl"` the item visually to the right is the
previous DOM sibling, submenus fly out to the left, and every
ArrowLeft/ArrowRight meaning flips. Instead of branching at each
dispatch site, `keydown` swaps ArrowLeft and ArrowRight into a
local `key` when `document.dir` is `"rtl"` and dispatches on
that. The switches keep reading as the LTR spec; RTL is one
input transform. Logical keys (Home, End, Tab, typeahead) follow
DOM order and pass through untouched. Direction is read from
`document.dir` on every keydown (DOM as state, never cached);
consumers declare `dir` on `<html>`. The pointer layer needs no
branch at all: the safety triangle's near-edge clamp and
signed-movement test are side-agnostic, and which side anything
opens on is consumer CSS.

**Monotonic token for async cancellation.** The router uses a
counter that increments on every `navigateTo`; callbacks check if
their token is still the latest before touching the DOM. Handles
rapid-fire clicks without locks or cancelation tokens.

## Code style

Rules only. Rationale lives in "Why the core looks weird" and
"Clever tricks" above.

### Formatting

- oxfmt defaults (`.oxfmtrc.json`, no overrides beyond ignoring
  `.html`/`.vue`/`.css`): 2-space indent, semicolons, double quotes,
  80-char line width. oxlint (`.oxlintrc.json`) runs its default
  `correctness` rules with the default plugins. `npm run lint` runs
  `oxlint` then `oxfmt --check`, covering both lint and format, and
  runs first in the pre-commit hook.
- `.js` extensions on value imports (NodeNext resolution).

### Functions

- Arrow functions in the core and router. React wrappers use
  `function` declarations for components (React convention, better
  stack traces). Vue wrappers use `defineComponent` with
  method-shorthand `setup`.
- Default parameter values with enum types instead of option
  objects when the set is small:
  `menu(trigger, mode = Focus.Trigger)`.
- No optional parameters that every caller supplies, and no
  return values that no caller reads. Signatures are the
  contract; unused generality is negative value here.
- Extract a helper at the second verbatim repetition of a
  multi-line pattern when it saves minified bytes
  (`tooltipSuppress`, `menubarStep`, `menuRoveIn`).

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
- ARIA IDL accessors (`ariaExpanded`, `ariaChecked`, `ariaHidden`,
  `ariaDisabled`, `ariaSelected`, `role`, `hidden`) over
  `getAttribute`/`setAttribute`. String API only where there's no
  IDL counterpart (`data-*`, `aria-labelledby`, `aria-controls`).
- Compare ARIA strings with `!== "true"` when the "not truthy"
  case is the one you care about.

### State

- Module-level `let` for mutable state shared between handlers;
  module-level `const` for structures (stacks, maps, parsers).
- No classes, no `this`, no closures-over-state threaded through
  call chains.
- `should*` flags drive cross-handler signalling within a single
  event cycle; cleared at the top of each listener.

### Types

- Enums for related string constants (`Prefix.TriggerMenu`,
  `Focus.First`). Numeric enums for mode-select flags, string
  enums for stable identifiers that appear in the DOM.
- Named-tuple types for 2-3 field shapes that stay module-private:
  `type Fetched = [html: string, url: string]`.
- Type guards as `is`-predicates (`isElement`, `isTrigger`,
  `isMenuItem`, `canHandle`). Narrow once at the listener entry;
  pass the narrowed value down.
- No `as`, `any`, or non-null `!` assertions in the core or
  router. Narrow with runtime checks. (Vue wrappers may use `as
PropType<...>` where Vue's prop typing requires it.)

### Events

- `addEventListener` on `window` / `document` only.
- Custom events (`mc:navigate`) for cross-boundary signals the
  wrappers need. No callback props or event-emitter exports from
  the core.
- Menu open/dismiss/activate on `pointerdown` / `pointerup`;
  `shouldSuppressClick` skips the trailing click. Enter/Space for
  menu are handled in `keydown` with `preventDefault`.
- `void` on fire-and-forget promise expressions.

### Naming

- Core primitives are named after the component they drive:
  `accordion`, `collapsible`, `dialog`, `menu`, `popover`,
  `tabs`, `tooltip`. Helpers extend the primitive with a verb:
  `menuOpen`, `menuCloseAll`, `dialogClose`, `tooltipSync`.
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
- Module state, alphabetical within its blank-line group.
  Groups in order: driver flags, generic state, then one group
  per component, components alphabetical.
- Type guards, generic helpers, roving callbacks, component
  clusters, and the functions within a cluster.
- Dispatch chains (`else if` prefix ladders). One exception: a
  check that must short-circuit the ladder (the menu break in
  the click walk) stays first, with a comment saying why.

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
- `Focus` enum: the default member first (`Trigger` is `0`),
  then semantic order.

## Prose style

Applies to all prose in the repo: code comments, TSDoc, README,
AGENTS.md, commit messages, PR descriptions.

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

- `src/index.ts` and `src/router.ts`: **fully commented.** TSDoc
  (`/** */`) for every declared symbol. Inline `//` for non-obvious
  decisions. File-top `@file` header explaining architecture,
  invariants, and file layout. This is the convention; keep it.
- `src/react/*`, `src/vue/*`: **no comments** except
  `// oxlint-disable-next-line` pragmas where required. Each file is
  small and self-evident.
- Tests: no comments except when the _why_ of a setup step would
  surprise the next reader (race conditions, sentinel globals, etc.).

Rolldown's minifier drops all comments from `dist/`, so comments are
free in source and never reach the published bundles.

## Build pipeline

`npm run build` (`node build.ts`) lints, bundles to `dist/` with
rolldown, emits `.d.ts` via `tsc`, and rewrites `package.json`'s
`versionMeta` (gzip sizes and Playwright test counts) from the
current source. The numbers are generated, never hand-edited.

**Requires Node >= 24.** `build.ts` and the SSR test server
(`tests/server.ts`) are run directly as TypeScript via Node's native
type stripping, so an older Node fails to start them. CI pins
`24.18.0`; the published package itself has no runtime Node
requirement (it ships browser ESM), which is why there is no
`engines` field constraining consumers.

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
  `aria-expanded`, `data-mode`, `role="menu"`, `Tab` (the
  key, to disambiguate from the noun) always quoted with backticks.
  PascalCase key names (`Enter`, `ArrowDown`, `Home`, `End`) are
  visually distinct enough that backticks are optional, but be
  consistent within a single test name.
- **One sentence, sentence-case, no trailing period, ≤80 chars.**
  Code identifiers keep their casing.
- **Describe blocks use a fixed top-level vocabulary** so the same
  capability has the same name across components: `ARIA`,
  `Initial state`, `Activation`, `Keyboard`, `Mouse`,
  `Focus management`, `Disabled`, `Edge cases`,
  `Structure independence`, `Click handler`, `Dynamic`. Per-component
  refinements (`Trigger keyboard`, `Item keyboard`, `Keyboard
(horizontal)`) are fine when the structure genuinely splits.
