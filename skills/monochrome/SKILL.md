---
name: monochrome
description: Build accessible UI with monochrome, the framework-agnostic UI library for agents. Use whenever a project depends on monochrome or has ids starting with mct:, mcc:, or mcr:, and whenever you write or fix an accordion, collapsible, dialog or modal, dropdown or context menu, menubar, popover, tabs, or tooltip in HTML, React, or Vue. Also use when asked to check, debug, or style such markup.
---

# monochrome

monochrome makes correctly marked-up HTML interactive. Import it
once; every component on the page works, including markup added
later (framework renders, `innerHTML`, streamed or generated HTML).
There is no init call, no state object, and no event wiring. The
DOM is the state: the core reads and writes ARIA attributes.

Components: Accordion, Collapsible, Dialog, Menu, Menubar, Popover,
Tabs, Tooltip. Optional: Router.

The spec for the installed version is in
`node_modules/monochrome/spec/`, one file per component plus
`choosing`, `conventions`, `styling`, and `router`;
`spec/<topic>.md` below means that folder. Without the package
installed, `npx monochrome docs <topic>` prints the same pages.

## Hard rules

1. **Ids wire everything.** `mct:<kind>:<id>` is a trigger,
   `mcc:<kind>:<id>` its content, `mcr:<kind>:<id>` a root. Every
   id is unique on the page.
2. **Link both ways.** Trigger `aria-controls` names the content id;
   content `aria-labelledby` names the trigger id (a dialog names
   its title). Accordion panels are `role="region"`; collapsible
   content links back only as a `role="region"`. Tooltip triggers
   use `aria-describedby`. One id per attribute.
3. **Triggers are `<button type="button">`.** Only tooltip triggers
   may be any focusable element.
4. **Never write JS to open, close, select, or toggle.** No
   `showModal()`, no `popovertarget`, no `useState` for open state,
   no handler that flips `hidden` or `aria-*`. The core does it.
   Handlers for what an item *does* (`onClick` on a menu item) are
   fine.
5. **State lives in ARIA.** Author the initial values
   (`aria-expanded="false"` plus `hidden`, `aria-selected`,
   `aria-checked`), then let the core own them. Disable with
   `aria-disabled="true"`, never `disabled` (the parts' `disabled`
   prop renders `aria-disabled` for you).
6. **monochrome ships no CSS; style with attribute selectors**:
   `[aria-expanded="true"]`, `[aria-selected="true"]`,
   `[aria-checked="true"]`, `[data-mc-highlighted]`,
   `:popover-open`, `dialog[open]`. Menus, popovers, and tooltips
   need the Required CSS from their spec's Styling section, copied
   as it is: it places them at their trigger from the variables and
   the `[data-mc-y]` / `[data-mc-x]` side the core writes. Don't
   write placement of your own. Pick a side and alignment with
   `data-mc-side` (`top`, `right`, `bottom`, `left`) and
   `data-mc-align` (`start`, `center`, `end`) on the content.
7. **One import family.** `import "monochrome"` (or the CDN script)
   for plain pages; in apps, the component files `add` writes (each
   imports its own `monochrome/<component>` module).
   Never both: listeners would register twice. When React or Vue
   only renders HTML on the server (a static site, no client bundle
   of the component files), their imports never reach the browser:
   load the core once from the script every page runs, and drop
   the core import (and `"use client"`) from the component files
   (`spec/conventions.md`, Server rendering).
8. **Deliberate behaviour is not a bug.** Each spec ends with Design
   choices: tabs select on Enter, not on focus; arrows skip disabled
   items; tooltips have no delay and never show on touch; menus
   open on press. Don't add code to change them.

## Which component

| Need | Use |
| --- | --- |
| List of actions or options, checkable items, submenus | Menu |
| Row of menus or dropdown navigation | Menubar |
| Interactive panel next to a button (form, share, picker) | Popover |
| Modal task or confirmation | Dialog |
| Short non-interactive hint on hover and focus | Tooltip |
| One show/hide region | Collapsible |
| Sections where only one is open | Accordion |
| Switch between peer panels | Tabs |

Details: `spec/choosing.md`.

## Workflow

1. Start from the reference, not from memory.
   `npx monochrome add <component>` installs `monochrome` at its
   own version, saves settings in `monochrome.json`, and prints the
   markup to start from (`--json` prints it all as JSON). In React
   and Vue it writes the parts instead (`src/components/ui/`, or
   `components/ui/` without a `src/` folder). For markup, add the
   line it prints that loads the core.
2. Place it where it belongs. Keep every role and ARIA link; change
   text, and rename id suffixes together so each id stays unique on
   the page (the parts make ids for you). The contract:
   `spec/<component>.md`.
3. Style it. For a menu, menubar, popover, or tooltip, first copy
   the Required CSS into the project's global CSS (rule 6). Then
   style every state the spec's Styling section lists (the selected
   tab, the highlighted and checked menu items, surfaces) the way
   the project styles everything else: its own CSS, Tailwind's
   `aria-*` and `data-*` variants, StyleX, or its design system.
   The spec's Example shows one way; adapt it. Patterns:
   `spec/styling.md`.
4. Verify the rendered HTML (what the server returns, or the DOM a
   client-rendered app builds), not the component source: go
   through the checklist in `spec/conventions.md` (Verify), then the
   component's Contract table, Common mistakes, and Design choices.
5. Fix every mismatch before you call it done.

New project: `npx monochrome init` installs the package, saves the
settings `add` uses, and adds a short block to `AGENTS.md`; it
works without a `package.json` too (pages then load the core from
a CDN). After an upgrade, apply the steps from
`npx monochrome changelog --from <old version>`, then verify again.

## Framework notes

- **HTML, server templates, htmx**: `add` prints the markup and
  the tag that loads the core once per page:
  `<script type="module" src="https://cdn.jsdelivr.net/npm/monochrome/dist/index.js"></script>`.
- **React 19**: `add menu` writes `src/components/ui/menu.tsx`
  (`.jsx` without a tsconfig); import `{ Menu }` from there (there is no
  `monochrome/react`). Parts render the spec's markup with `useId`
  ids. `default*` props are initial values; there is no controlled
  `open` prop. The files are `"use client"`; your component that
  passes handlers such as `onClick` needs it too (`add` prepends it
  in Next.js). Shared rules: `spec/conventions.md` (Parts).
- **Vue 3.5**: `add menu` writes `src/components/ui/menu/`, one
  single-file component per part and an `index.ts`; import
  `{ Menu }` from there (there is no `monochrome/vue`) and write
  `<Menu.Root>` in templates. Same markup, ids, and initial values
  as the React parts; props take the template's kebab-case
  (`default-checked`, `keep-open`). Shared rules:
  `spec/conventions.md` (Parts).
- **Other frameworks** (Svelte, Astro, Solid): `add` prints the
  markup (`--framework html`, the default without React or Vue);
  write it in templates and `import "monochrome"` once in the app
  entry. React below 19 or Vue below 3.5: the same, with
  `--framework html`.
- **SSR, streaming, generated HTML**: nothing to hydrate or re-run.
  Markup is live as soon as it is in the document.
- **Reacting to state**: observe the attribute with a
  `MutationObserver`; a trigger's own click handler runs before the
  core and sees the old state.

## Router quick rules

`import "monochrome/router"`. Wrap each page in
`data-mc-area="root"`; mark sub-regions with `data-mc-area="name"` and a
`data-mc-key` (same key on both pages keeps the region). Same-origin
links swap in place; `rel="external"`, `target="_blank"`,
`download`, cross-origin links, and forms are left alone. Re-run
page scripts on `addEventListener("mc:navigate", ...)`. Details:
`spec/router.md`.

## Common traps

- Missing `role="button"` on a standalone menu trigger, or
  `role="menuitem"` on submenu and menubar triggers.
- Menu items not wrapped as `li role="none"` with the item first.
- A menu radio set or labelled section outside a group: wrap it in
  `li role="none"` > `ul role="group"` named by its label
  (`Menu.Group label="…"` with the parts). A submenu wrapper is
  `Menu.Sub`.
- A menubar needs exactly one item with `tabindex="0"`.
- Tabs must be direct children of `role="tablist"`, exactly one
  `aria-selected="true"`.
- Accordion items must be direct children of the `mcr:accordion:`
  root, heading first, button first inside it.
- `popover="manual"` (not `auto`) on menu, popover, and tooltip
  content; `role="dialog"` on popover content; a `<dialog>` element
  for dialogs.
- `display` on closed content overrides `hidden` and the popover
  closed state; scope it to the open state.
- Dark mode: the page sets `color-scheme` (`:root` or `.dark`);
  monochrome never does, so without it surfaces stay light.
