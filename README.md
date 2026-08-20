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
// every component (helpers once)
import "monochrome"

// one component (helpers inlined into that file)
import "monochrome/menu"

// two or more: prefer the combined import. Several standalones
// each inline `dom.ts` and can exceed the combined file.

// optional router
import "monochrome/router"

// React wrappers (all, or one)
import { Accordion } from "monochrome/react"
import { Menu } from "monochrome/react/menu"

// Vue wrappers
import { Accordion } from "monochrome/vue"
```

## Example

```html
<script type="module" src="https://esm.sh/monochrome"></script>

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

See [AGENTS.md](./AGENTS.md) for architecture, invariants, and code style.

## License

MIT &copy; Colin van Eenige
