# Monochrome

Accessible UI component library. Best-in-class performance. HTML-first, React and Vue supported.

[![npm](https://img.shields.io/npm/v/monochrome.svg)](https://www.npmjs.com/package/monochrome)
[![gzip](https://img.badgesize.io/https://unpkg.com/monochrome/dist/index.js?compression=gzip&label=gzip)](https://unpkg.com/monochrome/dist/index.js)
[![CI](https://img.shields.io/github/actions/workflow/status/vaneenige/monochrome-ui/ci.yml?branch=main&label=CI)](https://github.com/vaneenige/monochrome-ui/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/monochrome.svg)](./LICENSE)

If you write accessible HTML, monochrome makes it interactive. The DOM is the state; ARIA attributes (`aria-expanded`, `aria-selected`, `aria-checked`) drive every component. No initialization, no mount hooks.

## Components

Accordion · Collapsible · Dialog · Menu · Menubar · Popover · Tabs · Tooltip.

Plus an optional client-side router and thin React and Vue wrappers.

## Install

```bash
npm install monochrome
```

```ts
// every component, one flat file. For pages that ship no other
// monochrome import; don't combine with the granular imports below
import "monochrome"

// one component (shared helpers dedupe across entries)
import "monochrome/menu"

// optional router
import "monochrome/router"

// React wrappers: each auto-imports its own core, so one import
// wires markup and behavior, tree-shaken to the components you use
import { Accordion, Menu } from "monochrome/react"

// Vue wrappers, same shape
import { Accordion, Menu } from "monochrome/vue"
```

## Example

```html
<script type="module" src="https://unpkg.com/monochrome"></script>

<button id="mct:collapsible:1" aria-expanded="false" aria-controls="mcc:collapsible:1">
  Show details
</button>
<div id="mcc:collapsible:1" aria-labelledby="mct:collapsible:1" hidden>
  Hidden by default, revealed on click.
</div>
```

The React and Vue wrappers generate the same HTML and ARIA; all interactivity comes from the core.

## Browser support

Core: Baseline 2024. Chrome 114 (2023-05-30), Safari 17
(2023-09-18), and Firefox 125 (2024-04-16). Uses the Popover
API and the native `<dialog>` element. No polyfills shipped.

Router: Navigation API (Baseline 2026). Chrome 135
(2025-04-01), Safari 26.2 (2025-12-12), and Firefox 147
(2026-01-13). Links are prefetched as they enter the
viewport and on hover; see
[`docs/router.md`](./docs/router.md). Older browsers keep
full page loads; `import "monochrome/router"` is a no-op
there.

View transitions: optional, see below. Full-page transitions
need Chrome 111, Safari 18, or Firefox 144; element-scoped
ones need Chrome 147. Everywhere else the component updates
instantly.

## View transitions

Add `data-view-transition` to a component's content, or to an
ancestor of it, and the component runs its change inside a
[view transition](https://developer.mozilla.org/docs/Web/API/View_Transition_API).
Your CSS decides what animates.

| Value      | Transition                                                |
| ---------- | --------------------------------------------------------- |
| `viewport` | The whole page (`document.startViewTransition`)           |
| `element`  | Only the element with the attribute (`startViewTransition` on it) |
| `none`     | None; opts a subtree out of an ancestor's value           |

Where to put it:

| Component   | Value      | On                                     |
| ----------- | ---------- | -------------------------------------- |
| Tabs        | `element`  | The tabs root (`mcr:tabs:`)            |
| Accordion   | `element`  | The accordion root (`mcr:accordion:`)  |
| Collapsible | `element`  | A wrapper around trigger and content   |
| Dialog      | `viewport` | The `<dialog>`                         |
| Popover     | `viewport` | The popover content                    |

Dialog and popover content sits in the top layer, outside any
element's snapshot, so only `viewport` animates both open and
close. Menu, Menubar, and Tooltip ignore the attribute: they
react to hover and to the press itself, and input that lands on
a running transition is dropped. Animate them with
`@starting-style` instead.

A card that morphs into its dialog and back. Only one element
may hold a `view-transition-name` at a time, so the name moves
from the card to the open dialog:

```html
<style>
  .card:has(+ dialog:not([open])),
  .card + dialog[open] {
    view-transition-name: card;
  }
</style>

<button class="card" type="button" id="mct:dialog-open:1"
  aria-haspopup="dialog" aria-controls="mcc:dialog:1">
  Project Aurora
</button>
<dialog id="mcc:dialog:1" aria-label="Project Aurora"
  tabindex="-1" data-view-transition="viewport">
  ...
  <button type="button" id="mct:dialog-close:1">Close</button>
</dialog>
```

The dialog animates on every close: the Close button,
Escape, a backdrop click with `closedby="any"`,
`requestClose()`, and `<form method="dialog">`. A `cancel`
listener that calls `preventDefault()` still keeps it open.
Calling `close()` yourself skips the transition, and
`requestClose(value)` keeps the previous `returnValue`.

What to expect:

- The change lands when the browser takes its snapshot, a
  frame after the event. Read state in a later event, or
  listen for the popover's `toggle` or the dialog's `close`
  event. The next key or click
  always applies a pending change before anything handles it,
  so fast input is never lost.
- A press on a running transition is dropped and finishes the
  transition, so the next press lands. Keep animations short
  (150 to 250 ms).
- A change made while the pointer is down, such as a popover
  closing on an outside press, is instant.
- A duplicate `view-transition-name` skips the transition;
  the change still happens.
- With `prefers-reduced-motion: reduce`, no transition
  starts.
- Without support, the change is instant. `element` never
  falls back to a full-page transition.

## Contributing

Library development uses Bun 1.4.2. Open a pull request
against `main`; do not push to it.

```bash
bun install
```

That installs dependencies and points Git at the repo
hooks. A commit runs lint, build, and typecheck. No
browsers.

To run tests locally:

```bash
bun run test:install
bun run test
```

Linux may need
`bunx playwright install --with-deps chromium` (sudo)
if Chromium will not launch. The full matrix is
`bun run test:install:all` then `bun run test:all`.
CI runs that matrix on the pull request.
[PRINCIPLES.md](./PRINCIPLES.md) holds the
non-negotiables, [AGENTS.md](./AGENTS.md) how to work in the
repo, and [docs/](./docs) how each mechanism works. Router notes
live in [`docs/router.md`](./docs/router.md).

## License

MIT &copy; Colin van Eenige
