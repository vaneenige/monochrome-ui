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
// every component, one flat file — for pages that ship no other
// monochrome import; don't combine with the granular imports below
import "monochrome"

// one component (shared helpers dedupe across entries)
import "monochrome/menu"

// optional router
import "monochrome/router"

// React wrappers — each auto-imports its own core, so one import
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
<div id="mcc:collapsible:1" aria-labelledby="mct:collapsible:1" aria-hidden="true" hidden>
  Hidden by default, revealed on click.
</div>
```

The React and Vue wrappers generate the same HTML and ARIA; all interactivity comes from the core.

## Browser support

Baseline 2024. Uses the Popover API and the native `<dialog>`
element. No polyfills shipped.

## Contributing

Library development uses Bun 1.4.1 (`bun install`, `bun run build`,
`bun run test`). See [AGENTS.md](./AGENTS.md) for architecture,
invariants, and code style.

## License

MIT &copy; Colin van Eenige
