# Migrate

How to take a consumer from one published `monochrome`
version to a later one. `README.md` and `docs/` describe
current behaviour. This file is the only place that records
what changed between npm versions (git tags `v0.1.0` …
`v0.16.0`). There are no GitHub Releases.

0.x does not promise that a minor bump is compatible.
Treat every item marked **Breaking** as a required edit.
Items marked **Added** are new surface; ignore them unless
the consumer wants that feature. Items marked **Behaviour**
do not change markup or imports, but they can fail tests
or surprise users.

## How to use this file (for agents)

1. Read the consumer `package.json` for `monochrome`
   (and `package-lock.json` / `bun.lock` if the declared
   range is a range). Call that version *from*.
2. Choose the target version (*to*). Default *to* is the
   latest heading in this file.
3. Walk every `##` version heading after *from*, through
   *to*, in order. Apply each **Breaking** edit. Do not
   skip a version that says "no breaking changes".
4. After the walk, match the consumer against
   [Current contract](#current-contract-0160). If their
   code still looks like an older snippet in this file,
   the upgrade is incomplete.
5. Plain HTML, React (`monochrome/react`), and Vue
   (`monochrome/vue`) share one DOM contract. A wrapper
   prop rename and the matching HTML attribute rename
   are the same change; apply both if the consumer uses
   both. In Vue templates the same props are kebab-case
   (`default-open`, `default-selected`) and the tab
   stop is `tabindex="0"`, not `tabIndex={0}`.
6. Do not paste every import sample in
   [Current contract](#current-contract-0160) into one
   file. Pick exactly one recipe. Do not delete a
   wrapper part because it is missing from a table
   (keep `Tabs.List`, `Menubar.Menu`, `Dialog.Content`).
7. Do not restyle from `docs/`. Those files are present
   tense and will not mention removed APIs.

## Grep index

Search the consumer for the left column. The version is
when that token last worked (or first appeared).

| If you see | Until | Change |
| --- | --- | --- |
| `from "monochrome/src"` or `files` including `src` | 0.2 | 0.3 ships `dist` only |
| `"use client"` inside `monochrome/react` | 0.2 | 0.3 dropped it; add it in the app on Next.js |
| `react` peer `>=18` | 0.11 | 0.12 requires React 19 |
| `import "monochrome"` plus `monochrome/react` or `/vue` | 0.11 | 0.12: pick one style of import |
| `Accordion.Root type=` / `data-mode` / `[data-mode]` | 0.12 | 0.13 exclusive only |
| `Accordion.Item open` / `Collapsible.Root open` | 0.12 | 0.13 `defaultOpen` |
| `Tabs.Tab selected` / `Tabs.Panel selected` | 0.12 | 0.13 `defaultSelected` |
| `CheckboxItem checked` / `RadioItem checked` | 0.12 | 0.13 `defaultChecked` |
| `Accordion.Header as="h1"` | 0.12 | 0.13 `h2` to `h6` only |
| `role="region"` on accordion panels | 0.12 | 0.13 dropped |
| `aria-hidden` written by monochrome | 0.12 | 0.13 dropped |
| `hidden="until-found"` | 0.7 | 0.8 boolean `hidden` |
| `data-orientation` | 0.8 | 0.9 `aria-orientation` on the tablist |
| `Menu.Root menubar` | 0.10 | 0.11 `Menubar` |
| `id="mcr:menu:` or className on `Menu.Root` | 0.10 | 0.11 Root is a fragment |
| `--pw` / `--ph` | 0.11 | 0.12 `--width` / `--height` |
| `[data-safe]` clip-path CSS | 0.11 | 0.12 JS triangle; delete the CSS |
| `--center` | 0.4 | 0.5 `--x` / `--y` (gone in 0.12) |
| `data-placement` | 0.5 | 0.6 removed |
| ids `mct:t:` (tabs) | 0.6 | 0.7 `mct:ta:` then 0.12 `mct:tabs:` |
| ids `mct:a:`, `mct:c:`, `mct:m:`, `mct:ta:`, `mct:to:`, `mct:p:`, `mct:dialog-o:`, `mct:dialog-c:`, `mcc:d:`, `mcc:m:`, `mcc:p:`, `mcc:to:`, `mcr:a:` | 0.11 | 0.12 full names required |
| `history.scrollRestoration = "manual"` | 0.12 | 0.13 leaves `"auto"` |
| `history.pushState` assumptions in router tests | 0.12 | 0.13 Navigation API |
| Menubar first trigger without `tabIndex={0}` | 0.12 | 0.13 author the tab stop |

## Current contract (0.16.0)

Destination after a full walk. Wrappers emit this HTML;
plain HTML must match it for the core to attach.

### Imports

Pick exactly one recipe. Do not combine the HTML barrel
or a granular core import with React or Vue wrappers
(that component's listeners register twice).

HTML, every component:

```ts
import "monochrome"
import "monochrome/router" // optional
```

HTML, one overlay (and optionally the router). Do not
also import `"monochrome"`. `monochrome/menubar` is the
same module as `monochrome/menu`; import one of them.

```ts
import "monochrome/menu"
```

React or Vue. Each named export side-effects its core.
Do not also import `"monochrome"` or `monochrome/menu`.

```ts
import { Accordion, Menu, Menubar } from "monochrome/react"
import { Accordion, Menu, Menubar } from "monochrome/vue"
```

Peers: `react` / `react-dom` `>=19` (optional), `vue`
`>=3.5` (optional). The published package is ESM only.
Load the CDN build with `type="module"`. Next.js App
Router files that import the React wrappers need
`"use client"` in the app (the wrappers do not ship it).

### HTML id prefixes

Custom ids must keep the prefix and add a unique
suffix. Wrappers already emit these.

The core dispatches with `id.startsWith` on triggers,
accordion root, and overlay content (menu, popover,
tooltip). Panels and dialog content are paired through
`aria-controls` / `aria-labelledby` /
`aria-describedby`, not prefix dispatch.

Dispatch prefixes:

| Role | Prefix |
| --- | --- |
| Accordion root | `mcr:accordion:` |
| Accordion trigger | `mct:accordion:` |
| Collapsible trigger | `mct:collapsible:` |
| Dialog open | `mct:dialog-open:` |
| Dialog close | `mct:dialog-close:` |
| Menu trigger | `mct:menu:` |
| Menu popover | `mcc:menu:` |
| Popover trigger | `mct:popover:` |
| Popover content | `mcc:popover:` |
| Tabs trigger | `mct:tabs:` |
| Tooltip trigger | `mct:tooltip:` |
| Tooltip content | `mcc:tooltip:` |

Pairing ids (wrappers emit these; core looks them up
from ARIA, not by prefix). Any unique id works as long
as `aria-controls` / `aria-labelledby` match. The
prefixes below are the wrapper convention:

| Role | Prefix |
| --- | --- |
| Accordion panel | `mcc:accordion:` |
| Collapsible panel | `mcc:collapsible:` |
| Dialog element | `mcc:dialog:` |
| Dialog title / description | `mcc:dialog-title:` / `mcc:dialog-description:` |
| Popover title / description | `mcc:popover-title:` / `mcc:popover-description:` |
| Tabs panel | `mcc:tabs:` |

Popover content defaults to `aria-labelledby` on the
trigger (`mct:popover:`), not the title id. Tooltip
trigger uses `aria-describedby`. Menu popovers use
`aria-labelledby` on the `role="menu"` element. Do not
invent a `mcr:menu:` root; `Menu.Root` renders no DOM
node. Wrappers also set `mcr:tabs:` on `Tabs.Root`;
the core does not read it.

Closed disclosure uses the `hidden` attribute (boolean),
not `hidden="until-found"` and not `aria-hidden`. Overlay
surfaces use `popover="manual"` (menu, popover, tooltip)
or a native `<dialog>`. A menu opens on `pointerdown`,
not a synthetic `HTMLElement.click()`.

### Wrapper props (React and Vue)

JSX / `createElement` names below. Vue templates use
kebab-case (`default-open`, `default-selected`,
`default-checked`) and `tabindex` instead of `tabIndex`.
These are initial DOM writes; the core then owns the
ARIA. They are not controlled-state props. A part
missing from this table is not a deletion (keep
`Collapsible.Trigger`, `Tooltip.Content`, and so on).

| Component | Prop | Notes |
| --- | --- | --- |
| `Accordion.Root` | (none besides HTML) | Always exclusive. No `type`. |
| `Accordion.Item` | `defaultOpen?`, `disabled?` | |
| `Accordion.Header` | `as?`: `h2` to `h6` | Default `h3`. Not `h1` (React type). |
| `Accordion.Trigger` / `Panel` | (HTML) | |
| `Collapsible.Root` | `defaultOpen?`, `disabled?` | |
| `Tabs.Root` | `defaultValue` (required), `orientation?` | |
| `Tabs.List` | (HTML) | Writes `aria-orientation`. Keep it. |
| `Tabs.Tab` | `value`, `defaultSelected?`, `disabled?` | |
| `Tabs.Panel` | `value`, `defaultSelected?`, `focusable?` | |
| `Menu.Root` | children only | No element, no `menubar`. |
| `Menu.Trigger` | `disabled?`, `tabIndex?` | Standalone default tab stop is 0. |
| `Menu.Popover` | (HTML) | `role="menu"`, `popover="manual"`. |
| `Menu.Item` | `disabled?`, `href?` | |
| `Menu.CheckboxItem` / `RadioItem` | `defaultChecked?`, `disabled?` | |
| `Menu.Label` / `Separator` | (HTML) | |
| `Menu.Group` | submenu slot | Trigger + Popover inside. |
| `Menubar.Root` | HTML on the `role="menubar"` `<ul>` | |
| `Menubar.Menu` | (HTML on the `li`) | Required. Provides the menu context. |
| `Menubar.Trigger` | `disabled?`, `tabIndex?` | Default `-1`. Set `tabIndex={0}` (Vue `tabindex="0"`) on exactly one stop. |
| `Menubar.Popover` | (HTML) | Same as `Menu.Popover`. |
| `Popover.Trigger` / `Dialog.Trigger` | `disabled?` | |
| `Popover.Content` / `Dialog.Content` | (HTML) | Dialog is a `<dialog>`. |
| `Popover.Title` / `Dialog.Title` | `as?`: `h1` to `h6` | Default `h2`. |
| `Popover.Description` / `Dialog.Description` | (HTML) | |
| `Dialog.Close` | (none) | `mct:dialog-close:` |
| `Tooltip.Root` / `Trigger` / `Content` | (HTML) | |

Namespaces: `Accordion`, `Collapsible`, `Dialog`, `Menu`,
`Menubar`, `Popover`, `Tabs`, `Tooltip`. Menu and Menubar
share Item / CheckboxItem / RadioItem / Label /
Separator / Group / Trigger / Popover. `Menubar.Menu`
is not optional.

### CSS hooks the core sets

On an open menu, popover, or tooltip: `--top`, `--right`,
`--bottom`, `--left` (trigger rect, px) and `--width`,
`--height` (content size, px). Positioning is consumer
CSS. The core does not set `z-index` (top layer).

On the current menu item: `data-highlighted` (hover and
keyboard). It is not a focus substitute.

Do not style `[data-safe]`, `[data-mode]`,
`[data-orientation]`, `[data-placement]`, `--pw`, `--ph`,
`--center`, `--x`, or `--y`. None of those are written
any more.

Open popovers still need a visibility rule, for example
`[popover]:popover-open { display: flex; }`.

### Router

`import "monochrome/router"`. Requires the Navigation
API (Chrome 135, Safari 26.2, Firefox 147). Elsewhere
the import is a no-op and clicks are full page loads.

Markup: a `data-area="root"` ancestor, optional named
`data-area` regions, optional `data-key` on each area
(same key keeps the node; a missing key always swaps).
Same-origin `<a>` clicks swap areas and dispatch
`mc:navigate` on `window`. Not intercepted: `download`,
`target="_blank"`, `rel="external"`, cross-origin,
forms. Only `text/html` responses are kept. Links are
prefetched on hover, focus, and when they enter the
viewport.

### Browsers

Core: Chrome 114, Safari 17, Firefox 125 (Popover API,
`<dialog>`). No polyfills.

## 0.1.0

2026-02-25. First publish.

**Added.** Accordion, Collapsible, Menu (including
in-tree menubar via `Menu.Root menubar`), Tabs. React
wrappers. Core side-effect import `import "monochrome"`.

HTML ids in the README and wrappers already use the
long form (`mct:collapsible:demo`). The core matches
with short `startsWith` prefixes (`mct:c`, `mct:a`,
`mct:m`, `mct:t`), so both long ids and hand-written
short ids work.

Hidden content: `hidden="until-found"` plus
`aria-hidden`. Accordion `type="single" | "multiple"`
writes `data-mode` on the root. `Accordion.Item` and
`Collapsible.Root` take `open`. `Accordion.Header as`
allows `h1` to `h6` (default `h3`). Panels have
`role="region"`. Tabs may omit `defaultValue` (first
tab is selected). Tabs write `data-orientation`.
`Menu.Root` renders a wrapper `div` (`mcr:menu:…`) and
accepts HTML props.

Package ships `src` and `dist`. `exports` include
`"."`, `"./src"`, `"./react"` (React entry is source
`.tsx`). Peer `react` `>=18`. React files start with
`"use client"`.

CSS: `--top`, `--right`, `--bottom`, `--left` on the
menu popover. Submenu safety triangle: `[data-safe]` on
the Group plus `--left`, `--center`, `--right`, `--top`,
`--bottom` for a consumer `clip-path`.

## 0.2.0

**Breaking (packaging).** `exports["./react"].default`
is `./dist/react/index.js`, not the `.tsx` source.
Apps that compiled `monochrome/react` from source must
consume the prebuilt ESM instead. Types for `"."` still
point at `src/index.ts`. `./src` remains exported.

No markup or prop changes.

## 0.3.0

**Added.** Vue wrappers: `import { Accordion } from
"monochrome/vue"`. Peer `vue` `>=3.5`.

**Breaking (packaging).** `files` is `["dist"]` only.
`exports["./src"]` is gone. Types come from
`dist/*.d.ts`. Imports of `monochrome/src` or of
individual `.tsx` files fail.

**Breaking (React).** Wrappers are `createElement` in
`.ts` files. The `"use client"` directive is gone. Next.js
App Router files that import `monochrome/react` must
declare `"use client"` themselves or the import is a
server-component error.

**Breaking (Tabs).** `Tabs.Root defaultValue` is
required. `Tabs.Tab` / `Tabs.Panel` require `value`.
Omitting `defaultValue` no longer selects the first tab.

## 0.4.0

**Added.** `import "monochrome/router"`. Same-origin
clicks swap `[data-area]` regions whose `data-key`
differs, or that have no key. Requires
`data-area="root"`. Dispatches `mc:navigate`.
Implemented with `history.pushState` and `popstate`
(works without the Navigation API).

No component markup changes.

## 0.5.0

**Breaking (CSS, menu).** Safety-triangle vars on the
Group: `--center` is gone; `--x` and `--y` are the
cursor. Clip-path should use
`clamp(var(--left), var(--x), var(--right))` for the
near edge.

**Behaviour / CSS.** Open menu content gets
`data-placement` of `top` | `bottom` | `left` | `right`
(auto-flip). Style that attribute if you relied on a
single hardcoded `top: var(--bottom)` rule.

Trigger rect vars `--top`, `--right`, `--bottom`,
`--left` are unchanged.

## 0.6.0

**Added.** Popover: `Popover.Root`, `.Trigger`,
`.Content`. HTML `mct:popover:` / `mcc:popover:`,
`popover="manual"`.

**Breaking (CSS, menu).** `data-placement` is no longer
set. Content size is published as `--pw` and `--ph`.
Do any flip in consumer CSS from those plus `--top`,
`--right`, `--bottom`, `--left`.

Safety-triangle `[data-safe]` / `--x` / `--y` remain.

## 0.7.0

**Added.** Tooltip: `Tooltip.Root`, `.Trigger`,
`.Content`. HTML `mct:tooltip:` / `mcc:tooltip:`,
`role="tooltip"`, `popover="manual"`.

**Breaking (HTML, only if ids were abbreviated).** Core
tabs prefix changes from `mct:t` to `mct:ta` so
`mct:tooltip:` is not a tab. Wrapper-generated
`mct:tabs:` still matches. Hand-written ids such as
`mct:t:home` stop activating as tabs; rename to
`mct:tabs:home`.

## 0.8.0

**Breaking (HTML / CSS / a11y).**
`hidden="until-found"` is gone. Closed panels use
boolean `hidden`. Find-in-page does not reveal collapsed
content. Wrappers no longer inject the inline script
that upgraded `hidden` to `hidden="until-found"`.
Stop depending on `beforematch`.

`aria-hidden` is still written (`true` when closed).

Wrapper index uses `export *`; named imports
`{ Accordion, Menu, … }` still work.

CDN examples use `type="module"` (the package was
already ESM).

## 0.9.0

**Breaking (HTML / CSS, Tabs).** Wrappers no longer set
`data-orientation` on `Tabs.Root` or `Tabs.Panel`. The
core never read it; orientation is
`aria-orientation` on the tablist (`Tabs.List`). Replace
CSS like `[data-orientation="vertical"]` with
`[role="tablist"][aria-orientation="vertical"]`.

Pass `orientation="vertical"` on `Tabs.Root` as before.

## 0.10.0

**Added.** Dialog: `Dialog.Root`, `.Trigger`, `.Content`
(`<dialog>`), `.Title`, `.Description`, `.Close`. HTML
`mct:dialog-open:`, `mct:dialog-close:`, `mcc:dialog:`.
`Popover.Title` and `Popover.Description`. Core also
needs the native `<dialog>` element (Baseline 2024).

No removals.

## 0.11.0

**Added.** `Menubar` namespace. Import it next to Menu:

```ts
import { Menubar } from "monochrome/react"
import { Menubar } from "monochrome/vue"
```

Parts: `Menubar.Root`, `.Menu`, `.Trigger`, `.Popover`,
plus shared Menu item parts.

**Breaking (Menu / Menubar markup).**

`Menu.Root menubar` is removed. `Menu.Popover` always
renders `role="menu"`, never `role="menubar"`.

`Menu.Root` renders no element: no wrapper `div`, no
`mcr:menu:` id, no `className` / HTML props on Root.
Move layout classes to `Menu.Trigger` / `Menu.Popover`.

Before (0.10):

```tsx
<Menu.Root menubar className="bar">
  <Menu.Popover>
    <Menu.Group>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Popover>…</Menu.Popover>
    </Menu.Group>
  </Menu.Popover>
</Menu.Root>
```

After:

```tsx
<Menubar.Root className="bar">
  <Menubar.Menu>
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Popover>…</Menubar.Popover>
  </Menubar.Menu>
</Menubar.Root>
```

The first `Menubar.Menu` still claims `tabIndex={0}`
automatically (until 0.13).

Plain HTML menubars: a `role="menubar"` list of
`mct:menu:` triggers, each labelling an `mcc:menu:`
popover via `aria-labelledby`. The core resolves the
menu from that pairing; a wrapping `mcr:menu:` node is
not required.

## 0.12.0

**Added.** Granular core entries: `monochrome/accordion`,
`/collapsible`, `/dialog`, `/menu`, `/menubar` (alias of
`/menu`), `/popover`, `/tabs`, `/tooltip`.
`data-highlighted` on the current menu item. `disabled`
on Menu, Dialog, and Popover triggers (`aria-disabled`).
RTL: `document.dir === "rtl"` mirrors ArrowLeft /
ArrowRight for Menu and Tabs.

**Breaking (imports).** Each React/Vue component
side-effects its core. Do not combine:

```ts
import "monochrome"
import { Menu } from "monochrome/react"
```

That registers that component's listeners twice
(toggles fire twice, focus fights itself). The barrel
still registers the other components once. HTML-only:
`import "monochrome"` or one `import "monochrome/menu"`.
Wrappers: import from `monochrome/react` or
`monochrome/vue` only.

**Breaking (React).** Peer `react` / `react-dom` `>=19`.
React 18 will not satisfy the peer and is not supported.

**Breaking (HTML ids).** Core prefixes are the full
names with a trailing colon (`mct:accordion:`,
`mct:dialog-open:`, `mcc:dialog:`, …). Short ids that
only matched because of `startsWith("mct:a")` stop
working. Rename:

| Old (last matched) | New |
| --- | --- |
| `mct:a:…` (to 0.11) | `mct:accordion:…` |
| `mct:c:…` (to 0.11) | `mct:collapsible:…` |
| `mct:m:…` (to 0.11) | `mct:menu:…` |
| `mct:t:…` (to 0.6) | `mct:tabs:…` |
| `mct:ta:…` (0.7 to 0.11) | `mct:tabs:…` |
| `mct:to:…` (0.7 to 0.11) | `mct:tooltip:…` |
| `mct:p:…` (0.6 to 0.11) | `mct:popover:…` |
| `mct:dialog-o:…` (0.10 to 0.11) | `mct:dialog-open:…` |
| `mct:dialog-c:…` (0.10 to 0.11) | `mct:dialog-close:…` |
| `mcc:d:…` (0.10 to 0.11) | `mcc:dialog:…` |
| `mcc:m:…` / `mcc:p:…` / `mcc:to:…` (to 0.11) | `mcc:menu:…` / `mcc:popover:…` / `mcc:tooltip:…` |
| `mcr:a:…` (to 0.11) | `mcr:accordion:…` |

Wrapper output was already the new form; only hand-written
abbreviated ids need edits.

**Breaking (CSS).** Content size vars `--pw` / `--ph`
become `--width` / `--height`. Replace every
`var(--pw)` / `var(--ph)`.

**Breaking (CSS, submenu).** `[data-safe]` is never set.
`--x`, `--y`, and the extra Group rect vars are gone.
Delete consumer `clip-path` triangle CSS. The core
implements the safety triangle in JS.

**Behaviour (Menu).** A menu opens on `pointerdown`, not
`click`. `HTMLElement.click()` on a trigger may not
open it; a real pointer or Playwright `.click()` (which
sends `pointerdown`) does. Hover paints `data-highlighted`
and focuses the item under the pointer.

**Behaviour (router).** Importing `monochrome/router`
sets `history.scrollRestoration = "manual"` for the
whole page (including navigations the router does not
intercept). 0.13 stops doing that.

## 0.13.0

**Breaking (Accordion).** Exclusive only. `type` and
`data-mode` are ignored and no longer written. There is
no multiple-open accordion. Opening an item closes the
others on the same `mcr:accordion:` root. Remove
`type="multiple"` and any `[data-mode]` CSS.

**Breaking (Accordion header).** `Accordion.Header as`
is `h2` | `h3` | `h4` | `h5` | `h6` (still default
`h3`). `as="h1"` is a TypeScript error in React. Vue
still accepts any string at runtime. Wrapper markup
`Item > Header > Trigger` is already valid. In
hand-authored HTML, the trigger must sit on the
first-child chain of each item (typically inside the
heading). Extra wrappers on that chain now work; they
did not in 0.12.

**Breaking (Accordion panel).** Wrappers no longer set
`role="region"` or `aria-hidden` on `Accordion.Panel`.
Selectors like `.accordion [role="region"]` need a new
hook (the panel id prefix `mcc:accordion:` or a class
you pass in).

**Breaking (wrapper prop names).** Initial-state props
are `default*` so they read as "write this ARIA once":

| Old | New | On |
| --- | --- | --- |
| `open` | `defaultOpen` | `Accordion.Item`, `Collapsible.Root` |
| `selected` | `defaultSelected` | `Tabs.Tab`, `Tabs.Panel` |
| `checked` | `defaultChecked` | `Menu.CheckboxItem`, `Menu.RadioItem` |

Leaving the old name: React forwards it onto the DOM
node, so the panel stays closed / unchecked /
unselected. Vue `Accordion.Item` / `Collapsible.Root`
fall `open` through onto the wrapper `div`; menu items
set `inheritAttrs: false`, so `checked` does not become
`aria-checked`. Rewrite every call site. Vue templates
use `default-open`, `default-selected`,
`default-checked`. `Tabs.Root defaultValue` is
unchanged.

**Added (Collapsible).** `disabled` on `Collapsible.Root`
(`aria-disabled` on the trigger), matching Accordion.

**Breaking (aria-hidden).** Core and wrappers never
write `aria-hidden`. Closed UI is `hidden`, a closed
`popover`, or a closed `<dialog>`. Strip
`aria-hidden` from authored HTML (the 0.12 README
example had it on the collapsible panel). The core
used to flip it on open; after 0.13 a leftover
`aria-hidden="true"` stays true on an open surface.
Replace CSS and tests that look for
`[aria-hidden="true"]` with `[hidden]`,
`:popover-open`, or `dialog[open]`. Do not add
`aria-hidden` back onto library surfaces; the core
will not flip it.

**Breaking (Menubar tab stop).** Wrappers no longer pick
the first `Menubar.Menu` for `tabIndex={0}`.
`Menubar.Trigger` and `Menubar.Item` default to `-1`.
A standalone `Menu.Trigger` still defaults to `0`.
Pass `tabIndex={0}` (Vue: `tabindex="0"`) on exactly
one menubar stop. A bar that leaves every item at `-1`
is skipped by Tab. `tabIndex` you pass wins. Keep
`Menubar.Menu` around each trigger and popover; dropping
it throws (no menu context) and every trigger defaults
to tab stop 0.

React:

```tsx
<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger tabIndex={0}>File</Menubar.Trigger>
    <Menubar.Popover>…</Menubar.Popover>
  </Menubar.Menu>
  <Menubar.Menu>
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <Menubar.Popover>…</Menubar.Popover>
  </Menubar.Menu>
</Menubar.Root>
```

Vue (same structure; `tabindex` not `tabIndex`):

```vue
<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger tabindex="0">File</Menubar.Trigger>
    <Menubar.Popover>…</Menubar.Popover>
  </Menubar.Menu>
  <Menubar.Menu>
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <Menubar.Popover>…</Menubar.Popover>
  </Menubar.Menu>
</Menubar.Root>
```

**Note (React 19 internals).** Wrappers use `use()` and
pass the Context object as the element type, not
`Context.Provider`. Those contexts are not exported.
No consumer import change if the peer is already 19.

**Breaking (router).** The router uses the Navigation
API only. No `history.pushState` / `popstate` path.
Without `window.navigation` the module is a no-op:
full page loads, no `mc:navigate`, no region swap.
That is Chrome 135, Safari 26.2, Firefox 147 (named
in `docs/router.md` in this release; recorded in
`package.json` `browserslist.router` from 0.16).
`data-area` / `data-key` markup is unchanged.

Scroll and fragments are the browser's.
`history.scrollRestoration` stays `"auto"`. Tests that
assert library-managed scroll snapshots need to be
rewritten or dropped.

## 0.14.0

**Behaviour (router).** Same-origin links are also
prefetched when they enter the viewport
(`IntersectionObserver`, fetch priority `"low"`), in
addition to hover and focus. More requests on pages
with many in-view links. Only `text/html` responses
are cached. Markup and the `mc:navigate` event are
unchanged. Older browsers still no-op the router.

No component API changes.

## 0.15.0

No breaking changes and no syntax changes.

**Behaviour (fixes).** A mouse open no longer focuses
the trigger (`Focus.None`), so a sticky header does
not steal the scroll and dismiss the menu. `href`
menuitems navigate once (the `click` walk does not also
activate). Dialog close does not refocus when focus is
already on the trigger.

## 0.16.0

No breaking changes and no syntax changes.

**Behaviour (router).** Navigate, hover, and focus
resolve the `<a>` itself or the nearest `<a>` ancestor
of `event.target`, so a click on an icon or span inside
a link still intercepts on Safari versions that name
the inner node. `package.json` `browserslist` records
the floors (core Chrome 114 / Safari 17 / Firefox 125;
router Chrome 135 / Safari 26.2 / Firefox 147).
`docs/router.md` already named those versions in 0.13;
this release puts them in `package.json` and the
README.

## Checklist (0.12 → 0.16, the usual jump)

Most consumers in the wild are on 0.12 or 0.13. From
0.12 to current:

1. React 19, already required in 0.12.
2. Rename `open` / `selected` / `checked` to
   `defaultOpen` / `defaultSelected` / `defaultChecked`.
3. Remove `Accordion.Root type` and `data-mode`.
   Accordions are exclusive.
4. `Accordion.Header as="h1"` → `h2` (or drop `as`).
5. Delete `aria-hidden` assertions and CSS; use
   `hidden` / `:popover-open`.
6. Put `tabIndex={0}` on one `Menubar.Trigger` (Vue:
   `tabindex="0"`). Keep `Menubar.Menu`.
7. Router needs the Navigation API; otherwise accept
   full page loads. Native scroll restoration is back
   (`"auto"`). Viewport prefetch starts in 0.14.
8. Confirm CSS uses `--width` / `--height`, not
   `--pw` / `--ph`, and has no `[data-safe]` triangle.
9. Confirm menus are tested with pointer events, not
   only `HTMLElement.click()`.

From 0.11 or earlier, also apply 0.12 (imports, full
id prefixes, React 19, CSS var rename) and 0.11
(`Menubar`, fragment `Menu.Root`) before that list.
