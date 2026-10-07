# Monochrome

The framework-agnostic UI library for agents. Accessible,
HTML-first components with no hydration.

[![npm](https://img.shields.io/npm/v/monochrome.svg)](https://www.npmjs.com/package/monochrome)
[![gzip](https://img.badgesize.io/https://unpkg.com/monochrome/dist/index.js?compression=gzip&label=gzip)](https://unpkg.com/monochrome/dist/index.js)
[![CI](https://img.shields.io/github/actions/workflow/status/vaneenige/monochrome-ui/ci.yml?branch=main&label=CI)](https://github.com/vaneenige/monochrome-ui/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/monochrome.svg)](./LICENSE)

If you write accessible HTML, monochrome makes it interactive. The
DOM is the state; ARIA attributes (`aria-expanded`,
`aria-selected`, `aria-checked`) drive every component. No
initialization, no mount hooks, no runtime dependencies.

Accordion · Collapsible · Dialog · Menu · Menubar · Popover · Tabs ·
Tooltip. Plus an optional client-side router, and React and Vue
components that `npx monochrome add` writes into your project.

## Start with your agent

```bash
npx monochrome init
```

That installs the package and adds a short block to `AGENTS.md`, which
Claude Code, Codex, Cursor, and Copilot read. From then on, "add a
dropdown to the header" is `npx monochrome add menu` in React or
Vue: the parts, written into your project, and the spec that says
how to style them in your project's own styles. Or tell your agent:

> Read https://monochrome-ui.com/SKILL.md and use monochrome for the
> UI.

The skill also installs with `npx skills add vaneenige/monochrome-ui`.

## Why agents get it right

- **Nothing to hallucinate.** A component is HTML plus ARIA. There
  is no state API, no init call to forget; the React and Vue parts
  take only initial values.
- **Verifiable.** The spec ends in a checklist for rendered HTML,
  and each component lists its contract and common mistakes, so an
  agent can verify any renderer's output against it.
- **Opinions written down.** Each component lists its design
  choices with the reason, such as tabs that select on Enter, so an
  agent keeps them instead of "fixing" them.
- **Docs that match your version.** The contract ships in the
  package at `node_modules/monochrome/spec/`, one markdown file per
  component, for agents to read.
- **Works with streamed and generated HTML.** Listeners live on
  `window`, so markup is live the moment it lands in the document:
  `innerHTML`, a framework render, or tokens streaming in.
- **ARIA is the state.** Browser agents read `aria-expanded` and
  `aria-selected` to know what is open, and operate components with
  ordinary clicks and keys.

## CLI

| Command | What it does |
| --- | --- |
| `npx monochrome init` | Set a project up: install monochrome, save the settings `add` uses, and add a short block to `AGENTS.md`. Works without a `package.json` too |
| `npx monochrome add menu tabs` | Print the markup to start from; in React and Vue, write the parts into your project, once. Says what to style and where the spec shows how (`--framework html\|react\|vue`, `--components <dir>`, `--dry-run`, `--json`) |
| `npx monochrome docs menu` | Print a component's spec: markup, parts, keyboard, how to style it, design choices, common mistakes. No topic lists them all |
| `npx monochrome changelog` | Print what changed since the version the project has, with the steps to upgrade (`--from <version>`, `--to <version>`) |

The CLI runs on Node 20 or later and has no dependencies. It always
installs `monochrome` at its own version, so the files it writes match
the core they import. Every release is in
[`CHANGELOG.md`](./CHANGELOG.md), with its upgrade steps first.

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

```

monochrome ships no CSS: you style each component with your
project's own styles, so it looks like the rest of the project from
the start. Each component's spec has a Styling section with the
states to style and an example. Menus, popovers, and tooltips also
need its Required CSS, which places them at their trigger
([`spec/styling.md`](./spec/styling.md)).

React and Vue: `npx monochrome add menu` writes the parts into your
project, under `src/components/ui/` (`components/ui/` without a
`src/` folder). In React that is `menu.tsx` (`.jsx` without a
tsconfig); in Vue, a `menu/` folder of single-file components with
an `index.ts`. Each component imports its own core module and its
parts take a class; the files are yours to edit. The parts need
React 19 or Vue 3.5. Both import the same way:

```ts
import { Menu } from "@/components/ui/menu"
```

There is no `monochrome/react` or `monochrome/vue` export: 0.18
removed them. The parts live in your project, and
`npx monochrome add` writes them.
Upgrading: `npx monochrome changelog --from <old version>`.

## Example

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/monochrome/dist/index.js"></script>

<button type="button" id="mct:collapsible:1" aria-expanded="false" aria-controls="mcc:collapsible:1">
  Show details
</button>
<div id="mcc:collapsible:1" hidden>
  Hidden by default, revealed on click.
</div>
```

The React and Vue components generate the same HTML and ARIA; all
interactivity comes from the core. The full contract for every
component, with its parts, keyboard tables, and how to style it,
is in [`spec/`](./spec) and at
[monochrome-ui.com](https://monochrome-ui.com).

## Browser support

Core: Baseline 2024. Chrome 114 (2023-05-30), Safari 17
(2023-09-18), and Firefox 125 (2024-04-16). Uses the Popover
API and the native `<dialog>` element. No polyfills shipped.

Router: Navigation API (Baseline 2026). Chrome 135
(2025-04-01), Safari 26.2 (2025-12-12), and Firefox 147
(2026-01-13). Links are prefetched on hover, focus, and
press, and, from the reader's first interaction, as they
enter the viewport; see [`docs/router.md`](./docs/router.md).
Older browsers keep full page loads; `import
"monochrome/router"` is a no-op there.

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
