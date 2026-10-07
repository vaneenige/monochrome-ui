---
title: Conventions
description: The markup contract every monochrome component shares.
---

# Conventions

monochrome is a set of window event listeners that read and write
ARIA. There is no initialization, no mount call, and no state
object: markup that follows this contract is interactive the moment
it is in the document. Every component page builds on the rules
below.

## One import

Import the core once per page. Every correctly marked-up component
on the page, present or future, becomes interactive. The core ships
no CSS: the project styles each component, and menus, popovers, and
tooltips need their Required CSS to open at their trigger
([How to style](styling.md)).

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/monochrome/dist/index.js"></script>
```

```ts
import "monochrome"
```

`npx monochrome add <component>` prints the markup to start from.
In React and Vue it writes component files instead
([Parts](#parts)), each component importing its own core module,
so using a component ships its markup and behaviour, and nothing
else.

```ts
import { Menu } from "@/components/ui/menu"
```

## Flat or granular, never both

There are two builds of the same core:

| Import | Build | Use when |
| --- | --- | --- |
| `monochrome` | One flat file with every component | A page with no other monochrome import (plain HTML, CDN) |
| `monochrome/accordion`, `monochrome/menu`, ... | One module per component, shared helpers deduped | You want a subset |
| Component files from `add` | Import the granular modules | React and Vue apps |
| `monochrome`, or the granular modules, in your client script | Either build, loaded once for every page | Parts that render on the server only ([Server rendering](#server-rendering)) |

The flat file duplicates the granular modules. Loading both
registers every listener twice, which toggles a disclosure open and
straight back closed. Pick one family per page: the bare import, or
granular imports plus component files. `monochrome/menubar` is an
alias of `monochrome/menu`. When you import components one by one,
import `monochrome/menu` before `monochrome/popover` so Escape
inside a menu in a popover closes the menu first (see
[Popover](popover.md)).

## Ids carry the wiring

Every interactive element is found by the prefix of its `id`. No
classes, no data attributes, no registration.

| Prefix | Meaning | Example |
| --- | --- | --- |
| `mct:` | Trigger: the element the reader presses or hovers | `mct:menu:file` |
| `mcc:` | Content: what the trigger opens, and parts inside it | `mcc:menu:file` |
| `mcr:` | Root: a container that groups items | `mcr:accordion:faq` |

The full shape is `prefix:kind:id`, for example
`mct:collapsible:details`. The `id` part is yours: any string that
is unique on the page. Using the same `id` part for a trigger and
its content (`mct:popover:share`, `mcc:popover:share`) keeps the
pair readable; the core only follows the ARIA links below.

Known kinds:

| Family | Kinds |
| --- | --- |
| `mct:` | `accordion`, `collapsible`, `dialog-open`, `dialog-close`, `menu`, `popover`, `tabs`, `tooltip` |
| `mcc:` | `accordion`, `collapsible`, `dialog`, `dialog-title`, `dialog-description`, `menu`, `menu-label`, `popover`, `popover-title`, `popover-description`, `tabs`, `tooltip` |
| `mcr:` | `accordion` (required), `collapsible` and `tabs` (optional, written by the parts, not read by the core) |

Ids are case-sensitive and must be unique. Two elements with the
same id make `getElementById` return the first, so the second
component silently drives the first one's content.

## ARIA links

A trigger names its content, and the content names its trigger
back. Collapsible content is the exception: it links back only when
it is a `role="region"`, since `aria-labelledby` names nothing on a
plain `div`.

| Link | From | To | Used by |
| --- | --- | --- | --- |
| `aria-controls` | trigger | content id | Accordion, Collapsible, Dialog, Menu, Popover, Tabs |
| `aria-labelledby` | content | trigger id (or a title id) | Accordion (with `role="region"`), Dialog, Menu, Popover, Tabs; Collapsible only with `role="region"` |
| `aria-describedby` | trigger | tooltip id | Tooltip |

Each attribute holds exactly one id. The core resolves it with
`document.getElementById`, so a space-separated list breaks the
link. Trigger and content can live anywhere in the document: a menu
popover can sit at the end of `body`, a tab panel in another
container.

## Triggers are buttons

Every trigger is a `<button type="button">`: Accordion, Collapsible,
Dialog open and close, Menu, Popover, and Tabs. Keyboard support
depends on it. Enter and Space on a native button synthesize the
`click` that Accordion, Collapsible, Dialog, Popover, and Tabs
listen for, and Accordion, Menu, and Tabs only handle keys on a
trigger that is an `HTMLButtonElement`. A `<div>` or `<span>`
trigger may respond to a mouse and ignore the keyboard.
`type="button"` keeps a trigger inside a `<form>` from submitting
it.

Tooltip is the exception: any focusable element can carry a
`mct:tooltip:` id (a link, an input, a button).

Menu items are the other exception: they are `<button>`,
`<a href>`, or, when disabled, `<span>`, each with a `menuitem*` role
(see [Menu](menu.md)).

## Disabled is `aria-disabled`

Disable a trigger, tab, or menu item with `aria-disabled="true"`.
The core checks that value and ignores the element. It stays in
the document and the accessibility tree, so a screen reader still
finds it and hears that it is unavailable, and a trigger that is
its own tab stop (an accordion header, a collapsible, dialog, or
popover button) stays reachable with Tab. Arrow keys, Home, End,
and typeahead skip it in Accordion, Menu, Menubar, and Tabs (see
[Design choices](#design-choices)). The native `disabled`
attribute removes the element from the tab order entirely and
gives the core nothing to read. Remove `aria-disabled` (or set it
to `"false"`) to enable. The element still receives clicks and
Enter, so a click handler of your own runs unless it checks
`aria-disabled` first.

## Who writes what

The DOM is the only state. Author the initial values, then let the
core own them.

| Attribute | Author writes | Core writes at runtime |
| --- | --- | --- |
| `id`, `role`, `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-haspopup`, `aria-orientation` | yes | never |
| `aria-disabled` | yes | never |
| `aria-expanded` | initial value | Accordion, Collapsible, Menu, Popover triggers |
| `hidden` | initial value | Accordion and Collapsible content, tab panels |
| `aria-selected`, `tabindex` on tabs | initial value | Tabs |
| `tabindex` on a tab panel | initial value, optional | Tabs, only when the panel already has one |
| `aria-checked` | initial value | Menu checkbox and radio items |
| `tabindex` on menubar items | initial value (one `0`) | Menu, moving the tab stop |
| `data-mc-highlighted` | never | Menu, on the current item |
| `--mc-trigger-top`, `--mc-trigger-right`, `--mc-trigger-bottom`, `--mc-trigger-left`, `--mc-content-width`, `--mc-content-height`, `--mc-available-height` | never | Menu, Popover, Tooltip content |
| `data-mc-x`, `data-mc-y` | never | Menu, Popover, Tooltip content: the side it opened on, one or the other |
| `data-mc-side` | `top`, `right`, `bottom`, or `left` on Menu, Popover, or Tooltip content, optional | never |
| `data-mc-align` | `start`, `center`, or `end` on Menu, Popover, or Tooltip content, optional | never |
| `data-mc-keep-open` | on a Menu item, optional | never |
| `data-mc-autofocus` | on a Dialog, optional: the id of the element to focus on open | never |
| popover open state (`:popover-open`) | `popover="manual"` | Menu, Popover, Tooltip |
| dialog open state (`open`) | never | Dialog, via `showModal()` |

Never write JS to open or close a component, and never set
`aria-hidden`: `hidden`, a closed popover, and a closed `<dialog>`
already drop their subtree from the accessibility tree. To open
something from a script, call `trigger.click()` (Accordion,
Collapsible, Dialog, Popover, Tabs); Menu opens on `pointerdown` and
keys. To react to a change, observe the attribute:

```ts
new MutationObserver(() => {
  console.log(trigger.getAttribute("aria-expanded"))
}).observe(trigger, { attributeFilter: ["aria-expanded"] })
```

A `click` handler on the trigger runs before the core's `window`
listener, so it still sees the previous state. Menu is the
exception: it opens on `pointerdown` and keys, before any click.

## Markup can arrive at any time

Listeners live on `window`, one set per component, and are never
removed. Each event resolves its component from the target's id at
the moment it fires. So markup works no matter how it got there:
server-rendered, `innerHTML`, a framework render, a router swap, or
HTML an agent streams in token by token. Nothing needs to re-run
after an insert, and nothing leaks after a removal. A trigger whose
content has not arrived yet does nothing until it has.

## Server rendering

Every core file guards on `typeof document`, so importing it on a
server is a no-op. The parts render plain elements, so they work
with server rendering in React and Vue. The React component files
carry `"use client"`, so they also work with streaming and React
Server Components. There is no hydration step: the server HTML is
already the interactive component. A Server Component cannot pass
functions, so your own component that gives a part an event
handler (`onClick` on a `Menu.Item`) needs `"use client"` at the
top of its file.

### Parts that render on the server only

Some projects use React or Vue as a template language and ship
none of it to the browser: a static site generator,
`renderToStaticMarkup` or Vue's `renderToString` at build time,
server templates written in JSX. There, the component files never
reach the browser, so the core import each component carries only
runs on the server, where it does nothing. The HTML is right and
nothing responds.

Load the core from the script the browser does run, once for every
page: `import "monochrome"`, or the granular modules for the
components the site uses. Then drop the core import (and, in
React, `"use client"`) from each component's files: they only run
on the server and mark nothing. With the [router](router.md), load every
component the site uses up front: a page swapped in can hold one
the first page did not.

```ts
// The one script every page loads.
import "monochrome"
```

The split is where the browser code lives, not which framework is
involved. Component files that ship to the browser (a client
bundle, hydration, Server Components with a client boundary) keep
their imports. Pages whose parts render on the server only load
the core from their own script.

## Parts

`npx monochrome add <component>` writes each component's parts into
`src/components/ui/` (`components/ui/` without a `src/` folder,
`--components <dir>` for another folder) and never overwrites a
file that exists. In React that is one file, `<component>.tsx`
(`.jsx` in a project without a tsconfig). In Vue it is a folder,
`<component>/`, with one single-file component per part and an
`index.ts` that loads the core and names the parts. Both import the
same way:

```ts
import { Menu } from "@/components/ui/menu"
```

The example `add` prints shows each component's parts in use, and
the component's spec lists, under Parts, what its props do beyond
the markup. The same rules hold for every component, in both
frameworks:

- Parts render the component's markup and nothing else: no state,
  no effects, no event handlers. Each component imports its own
  core module (`monochrome/<component>`), from its file in React
  and from its `index.ts` in Vue. The React files start with
  `"use client"`.
- Ids come from `useId`, so every instance is unique without you
  naming it.
- Every part that renders an element passes the rest of its props
  (in Vue, its attributes) to that element, `ref` included in
  React 19. The ids, roles, and ARIA links a part writes come after
  yours and win; a default that is meant to be replaced says so in
  the component's Parts section.
- `defaultOpen`, `defaultValue`, `defaultSelected`, and
  `defaultChecked` (`default-open` and so on in a Vue template) are
  initial values. After the first render the core owns the
  attribute and a re-render leaves it alone. There is no controlled
  `open` or `value` prop and no change event: observe the attribute
  (see [Who writes what](#who-writes-what)), and remount with a new
  `key` to reset.
- `disabled` on a part renders `aria-disabled="true"`, never the
  native attribute. Accordion and Collapsible take it on the `Item`
  and the `Root`: their `Trigger` would pass it to the `<button>` as
  native `disabled`. A disabled part drops its click handler
  (`onClick`, `@click`), so it never runs.
- A part outside its root throws an error naming the root it needs
  (`Menu.Root`).
- `Root` parts that render a `div` (Collapsible, Dialog, Popover,
  Tooltip) exist to scope the ids; the `div` is a block box. Inside
  inline content, such as a tooltip in a sentence, give it
  `display: contents` or a class, and keep it out of a `<p>`, where
  a `div` is invalid HTML.
- React 19 or later: the parts use `use()` and render context
  providers directly. Vue 3.5 or later: the parts use `useId`.

## Right to left

Set `dir="rtl"` on `<html>`. Menu and Tabs read `document.dir` on
every keydown and mirror ArrowLeft and ArrowRight. Which side a
surface opens on is your CSS; Menu's Required CSS opens submenus to
the left on a right-to-left page.

## Dark mode

The page declares `color-scheme`. Use
`:root { color-scheme: light dark }` to follow the OS, or
`.dark { color-scheme: dark }` for a class toggle. A dark page
without it is a common mistake: menus, popovers, dialogs, and
tooltips stay light on it, since the browser fills them with
`Canvas`. See [Dark mode](styling.md#dark-mode).

## Browser support

Core: Baseline 2024. Chrome 114 (2023-05-30), Safari 17
(2023-09-18), Firefox 125 (2024-04-16). It uses the Popover API and
the native `<dialog>` element. No polyfills.

Router: Navigation API (Baseline 2026). Chrome 135, Safari 26.2,
Firefox 147. Older browsers keep full page loads (see
[Router](router.md)).

## Design choices

Deliberate choices every component shares. They are not bugs;
don't work around them. Each component page lists its own.

- **No timers.** Nothing waits, debounces, or animates in script:
  every change happens in the event that caused it. A delay is CSS
  (`transition-delay`), which is also why tooltips show at once.
- **Disabled items are skipped while roving.** Arrow keys, Home,
  End, and typeahead pass over `aria-disabled` items in Accordion,
  Menu, Menubar, and Tabs, so the keyboard never stops on something
  that does nothing. APG allows focusable disabled items; here they
  stay announced (screen reader browse mode reads them) but are not
  keyboard stops, except accordion headers, which are their own tab
  stops.
- **The DOM is the state.** No component keeps a copy. Change an
  attribute and the component follows; read an attribute to know
  its state.
- **Direction comes from `<html dir>`.** Arrow keys mirror only
  when `document.dir` is `rtl`; a `dir="rtl"` subtree in a
  left-to-right page does not swap them.
- **Chords pass through.** Keys held with Alt, Ctrl, or Meta go to
  the browser, so shortcuts such as Alt+ArrowLeft (Back) never move
  focus in a widget.

## Verify

Check the rendered HTML, not the component source: what a server
returns, or the DOM a client-rendered app builds. Any renderer can
get these wrong, so go through the list, then the component's
Contract table and Common mistakes.

- Every id is unique on the page, and every `mct:`, `mcc:`, and
  `mcr:` id has the shape `prefix:kind:id` with a kind from
  [Ids carry the wiring](#ids-carry-the-wiring).
- Every `aria-controls`, `aria-labelledby`, and `aria-describedby`
  names exactly one id, and that element exists. `aria-controls`
  points at content of the same kind: a `mct:menu:` trigger controls
  a `mcc:menu:` element, a `mct:dialog-open:` trigger a `mcc:dialog:`
  one.
- Every content element links back with `aria-labelledby` (its
  trigger, or a dialog's title). Accordion panels are
  `role="region"`. Collapsible content has neither, or both. A
  `mcc:` element no trigger points at is inert.
- Triggers are `<button type="button">`; only a tooltip trigger may
  be another focusable element.
- Disabled is `aria-disabled="true"`, never `disabled`.
- Menu, popover, and tooltip content has `popover="manual"`, never
  `popover` or `popover="auto"`, and no `hidden`. Menu and popover
  triggers start with `aria-expanded="false"`.
- Accordion and collapsible content has `hidden` exactly when its
  trigger says `aria-expanded="false"`.
- Nothing opens, closes, or selects in a handler: no `showModal()`,
  `showPopover()`, `popovertarget`, or code that flips `hidden` or an
  `aria-*` state.
- A `role="tab"`, `role="tooltip"`, or `<dialog>` without
  monochrome ids is plain HTML: nothing runs it. Menu roles are the
  exception: the core's keys act on any `role="menuitem"` and
  `role="menubar"`, so don't mix another menu library's markup into
  the page.
- The core runs in the browser: a script every page loads imports
  it, directly or through component files that ship to the browser.
  When the parts render on the server only, the component files never
  reach the browser, and their imports with them
  ([Server rendering](#parts-that-render-on-the-server-only)).
- Menus, popovers, and tooltips have their Required CSS: each opens
  at its trigger, not in the middle of the screen.
- Every state a user must see has a style in the project's own
  styles: the selected tab, the highlighted and checked menu items.
  Each component's Styling section lists its hooks.
