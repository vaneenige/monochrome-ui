# Changelog

Every release of `monochrome`, newest first. Under each version,
in this order and only when there is something to say: Upgrade
(the steps to take, in order), Breaking, Added, Changed, Fixed,
and Removed. Before 1.0, a minor release may break; its Upgrade
steps say exactly what to change. Across several versions, apply
each Upgrade section in turn, starting from the oldest.

The package ships this file, so the CLI prints what changed since
the version a project has, with the steps to upgrade:

```bash
npx monochrome changelog               # since the installed version
npx monochrome changelog --from 0.17.0 # since a given version
```

## 0.18.0 (2026-10-07)

### Upgrade

1. Find what this release renames or removes in your code:

   ```bash
   grep -rnE "monochrome/(react|vue)|data-highlighted|data-(area|key)=|var\(--(top|right|bottom|left|width|height)\)" \
     --exclude-dir=node_modules --exclude-dir=dist .
   ```

2. React: replace the `monochrome/react` import. Run
   `npx monochrome add` with every component you use, then import
   the parts from the file it writes. Part names and props are
   unchanged, except the submenu wrapper (step 3). The parts need
   React 19.

   ```diff
   - import { Menu, Tabs } from "monochrome/react";
   + import { Menu } from "@/components/ui/menu";
   + import { Tabs } from "@/components/ui/tabs";
   ```

   Each part imports its own core module, so remove any
   `import "monochrome"` in the same app.

   React that renders on the server only (a static site, no client
   bundle of the parts) is the exception: the parts never reach the
   browser. Keep the core import in the script every page loads,
   and drop the core import and `"use client"` from each part
   (`spec/conventions.md`, Server rendering).

3. React and Vue menus: the submenu wrapper `Menu.Group` is now
   `Menu.Sub` (`Menubar.Group` is `Menubar.Sub`). `Menu.Group` now
   means a labelled group of items.

   ```diff
   - <Menu.Group>
   + <Menu.Sub>
       <Menu.Trigger>Share</Menu.Trigger>
       <Menu.Popover>…</Menu.Popover>
   - </Menu.Group>
   + </Menu.Sub>
   ```

   Then group each radio set (optional, recommended):

   ```diff
   - <Menu.Label>Theme</Menu.Label>
   - <Menu.RadioItem defaultChecked>Light</Menu.RadioItem>
   - <Menu.RadioItem>Dark</Menu.RadioItem>
   + <Menu.Group label="Theme">
   +   <Menu.RadioItem defaultChecked>Light</Menu.RadioItem>
   +   <Menu.RadioItem>Dark</Menu.RadioItem>
   + </Menu.Group>
   ```

   In HTML, wrap the set in `li role="none"` holding a
   `ul role="group"` whose `aria-labelledby` names its label `li`
   (first in the group), or give it an `aria-label`. Ungrouped
   radio runs keep working.

4. Vue: replace the `monochrome/vue` import the same way. Run
   `npx monochrome add` with every component you use; in a Vue
   project it writes each component as a folder of single-file
   components with an `index.ts`. Import the parts from it. Part
   names and props are unchanged, except the submenu wrapper
   (step 3). The parts need Vue 3.5.

   ```diff
   - import { Menu, Tabs } from "monochrome/vue";
   + import { Menu } from "@/components/ui/menu";
   + import { Tabs } from "@/components/ui/tabs";
   ```

   Each component's `index.ts` imports its own core module, so
   remove any `import "monochrome"` in the same app, except where
   the parts render on the server only (step 2).

5. Rename the positioning custom properties in your CSS:

   ```diff
   - top: var(--bottom);
   - left: var(--left);
   - min-width: var(--width);
   + top: var(--mc-trigger-bottom);
   + left: var(--mc-trigger-left);
   + min-width: var(--mc-content-width);
   ```

   `--top`, `--right`, `--bottom`, `--left` become
   `--mc-trigger-top`, `--mc-trigger-right`, `--mc-trigger-bottom`,
   `--mc-trigger-left`; `--width` and `--height` become
   `--mc-content-width` and `--mc-content-height`.

6. Rename the menu highlight selector:

   ```diff
   - [role^="menuitem"][data-highlighted] { background: var(--hover); }
   + [role^="menuitem"][data-mc-highlighted] { background: var(--hover); }
   ```

7. Router: rename the page region attributes.

   ```diff
   - <main data-area="root" data-key="docs">
   + <main data-mc-area="root" data-mc-key="docs">
   ```

8. Popover markup written by hand: add `role="dialog"` to the
   content. The parts render it for you.

   ```diff
   - <div id="mcc:popover:share" aria-labelledby="mct:popover:share" popover="manual" tabindex="-1">
   + <div role="dialog" id="mcc:popover:share" aria-labelledby="mct:popover:share" popover="manual" tabindex="-1">
   ```

9. Your own CSS for menus, popovers, and tooltips misses this
   release's placement and accessibility fixes. monochrome still
   ships no CSS; each spec's Styling section now has the Required
   CSS for those three. Replace your placement rules with it, as a
   whole: it reads `data-mc-x` and `data-mc-y` as the side
   the content opened on (see Added), caps and scrolls a surface too
   tall for the viewport, and bridges the gap between a tooltip and
   its trigger. `npx monochrome docs <component>` prints it. Keep a
   keyboard focus ring on menu items:

   ```css
   [id^="mcc:menu:"] [role^="menuitem"]:focus-visible {
     outline: 2px solid currentColor;
     outline-offset: -2px;
   }
   ```

10. Accordion markup written by hand: add `role="region"` to every
    panel. The parts render it for you.

    ```diff
    - <div id="mcc:accordion:faq-1" aria-labelledby="mct:accordion:faq-1" hidden>
    + <div role="region" id="mcc:accordion:faq-1" aria-labelledby="mct:accordion:faq-1" hidden>
    ```

11. Collapsible markup written by hand: drop `aria-labelledby` from
    the content, or keep it together with `role="region"` for a
    named landmark. The parts write it only for a region.

    ```diff
    - <div id="mcc:collapsible:details" aria-labelledby="mct:collapsible:details" hidden>
    + <div id="mcc:collapsible:details" hidden>
    ```

12. Menus: checkbox and radio items now close the menu on click,
    press-drag-release, and Enter, like every other item. Space
    still toggles them and leaves the menu open. Find them:

    ```bash
    grep -rnE "menuitem(checkbox|radio)|(Checkbox|Radio)Item" \
      --exclude-dir=node_modules --exclude-dir=dist .
    ```

    Add `data-mc-keep-open` (no value) to each item that should
    keep the menu open as before, such as a set the reader toggles
    several of in a row. With the parts, pass `keepOpen`
    (`keep-open` in a Vue template):

    ```diff
    - <button type="button" role="menuitemcheckbox" aria-checked="true" tabindex="-1">Show grid</button>
    + <button type="button" role="menuitemcheckbox" aria-checked="true" tabindex="-1" data-mc-keep-open>Show grid</button>
    ```

    ```diff
    - <Menu.CheckboxItem defaultChecked>Show grid</Menu.CheckboxItem>
    + <Menu.CheckboxItem defaultChecked keepOpen>Show grid</Menu.CheckboxItem>
    ```

    Leave the other items as they are: they close on a choice.

13. Dialogs: focus now lands on the dialog itself on open, not on
    its first focusable element. Where a control should take focus,
    name it in the dialog's `data-mc-autofocus`, by id: the first
    field of a form, or Cancel in a destructive confirmation. In
    React, replace `autoFocus` inside a dialog with `initialFocus`
    on `Dialog.Content` (`"close"`, or the element's id). Leave the
    rest as they are.

14. Check the rendered HTML against the Verify checklist in
    `node_modules/monochrome/spec/conventions.md`.

### Breaking

- The `monochrome/react` and `monochrome/vue` exports are removed,
  with the optional `react`, `react-dom`, and `vue` peer
  dependencies. React and Vue parts now live in your project,
  written by `npx monochrome add`.
- The positioning custom properties on open surfaces are renamed:
  `--mc-trigger-top`, `--mc-trigger-right`, `--mc-trigger-bottom`,
  `--mc-trigger-left`, `--mc-content-width`, `--mc-content-height`.
- The painted menu item carries `data-mc-highlighted`, not
  `data-highlighted`.
- The router reads `data-mc-area` and `data-mc-key`, not
  `data-area` and `data-key`.
- React and Vue: `Menu.Group` (and `Menubar.Group`) is a labelled
  group, not the submenu wrapper; the submenu wrapper is `Menu.Sub`
  (`Menubar.Sub`).
- Menu checkbox and radio items close the menu on click,
  press-drag-release, and Enter, like every other item. Space on
  one toggles it and leaves the menu open, as APG specifies.

### Added

- The `npx monochrome` CLI. `init` installs the package, saves the
  settings `add` uses in `monochrome.json`, and adds a short block
  to `AGENTS.md`; it works without a `package.json` too. `add`
  prints the markup and the line that loads the core, in any stack
  (`--framework html`); in React (`.tsx` or `.jsx`) and Vue
  (single-file components) it writes the parts instead and prints
  an example. It writes no CSS, and
  says which spec sections to style the component from. Both take
  `--dry-run` and `--json`. `docs` prints the spec for a
  component, and `changelog` prints this file's entries since a
  version.
- `spec/`: the markup contract, one file per component plus
  `choosing`, `conventions`, `styling`, and `router`, shipped in
  the package for agents.
- `skills/monochrome/SKILL.md`: an agent skill.
- A Styling section in every component's spec: how to style it in
  the project's own styles. It lists the hooks, has the Required
  CSS that places menus, popovers, and tooltips at their trigger
  (copied as it is, in `@layer components`), and an Example that
  styles every state. `spec/styling.md` covers plain CSS, Tailwind,
  and StyleX. monochrome ships no CSS.
- Placement: `data-mc-side` (`top`, `right`, `bottom`, `left`) and
  `data-mc-align` (`start`, `center`, `end`) on menu, popover, and
  tooltip content pick the side of the trigger it opens on and where
  it lines up along that side; `start` and `end` follow the text
  direction. Defaults: a menu below with its items' leading edges on
  the trigger's (it sits out by its inset), a submenu beside its
  trigger in its parent's direction, a popover below and centered, a
  tooltip above and centered. The core writes
  the side the content actually opened on, `data-mc-y` (`top`,
  `bottom`) or `data-mc-x` (`left`, `right`), flipped when it does
  not fit and the opposite side has more room, and the spec's
  Required CSS places from that alone. Parts: `side` and `align` on
  `Menu.Popover`, `Popover.Content`, and `Tooltip.Content`.
- `Dialog.Action`: a button for the dialog's own action, next to
  `Dialog.Close`; it does not close the dialog.
- `CHANGELOG.md` ships in the package.
- `data-mc-autofocus` on a Dialog names, by id, the element to focus
  on open. Unlike `autofocus`, it survives React's client rendering
  and does nothing on page load. Parts: `initialFocus` on
  `Dialog.Content`.
- Menu groups: `li role="none"` holding a `ul role="group"`, named
  by `aria-labelledby` (its label `li`) or `aria-label`, so screen
  readers announce the group's name with its items. Arrow keys,
  Home, End, and typeahead walk through a group as through the
  menu; a group is never a stop. Radio items in a group are one
  set. Parts: `Menu.Group label="…"`.
- Menus and popovers fit the viewport: flip first, then cap and
  scroll. Too tall for the room on either side, they open on the
  side with more room, capped to it, and scroll inside;
  `overscroll-behavior: contain` keeps a wheel at the end from
  scrolling the page, which would close the menu. A surface that
  fits is never capped, and a capped one above its trigger stays
  flush with it. A root menu never covers its trigger. Root menus
  cap their width to the viewport.
- Submenus move up to stay inside the viewport, over their parent
  if need be, and scroll when taller than it.
- `--mc-available-height` on open Menu, Popover, and Tooltip
  content: the room between the trigger and the viewport edge on
  the side it opens, when that side is above or below.
- `data-mc-keep-open` on a menu item, of any role, keeps the menu
  open when it activates. Parts: `keepOpen` on `Menu.Item`,
  `Menu.CheckboxItem`, and `Menu.RadioItem`.

### Changed

- `Collapsible.Root` writes a `mcr:collapsible:` id, a hook for
  the project's own layout; the core never reads it.
- The collapsible spec's example is an order summary whose trigger
  sits in a title row, apart from the content it opens.
- Menu ignores keys pressed with Alt, Ctrl, or Meta, so browser
  shortcuts such as Alt+ArrowLeft pass through. Accordion and Tabs
  already did.
- A scroll inside a menu closes only the submenus below it; any
  other scroll closes every menu.
- A tooltip shown by focus stays open on scroll and moves with its
  trigger; a tooltip shown by hover hides.
- Hovering a plain menubar item while a bar menu is open closes
  that menu.
- A menu closed by an outside press, a second press on its trigger,
  or a scroll no longer leaves its trigger highlighted; on a
  menubar, the item stayed painted after its menu was gone. Escape
  still leaves the trigger highlighted for the keyboard.
- Dialog focuses its trigger before it opens, so every close
  (Escape, a `method="dialog"` form, Close) returns focus to the
  trigger, in Safari too.
- Dialog focuses the dialog itself on open unless its
  `data-mc-autofocus` names a target, instead of the browser's
  first focusable element (usually the close button). Give the
  dialog `outline: none`; the spec's Styling says so.
- The router closes the `dialog` that holds a clicked link once
  the next page has loaded, so a search dialog does not stay open
  over the new page. A dialog that closes before then, by the page
  or the reader, is left alone, so one reopened while the page
  loads stays open.
- Popover content is a `role="dialog"`: the spec's anatomy and
  contract list it, and `Popover.Content` renders it (pass `role`
  to replace it). Without a role, screen readers ignore the
  content's `aria-labelledby` name.
- Accordion panels are `role="region"`, named by their trigger.
  Only one panel is open at a time and closed panels are `hidden`,
  so an accordion adds at most one landmark.
- Collapsible content no longer requires `aria-labelledby`, which
  names nothing on a plain `div`. `Collapsible.Panel` writes it
  only when you pass `role="region"`.
- `Dialog.Content` and `Popover.Content` document
  `aria-describedby={undefined}`: without a Description, it drops
  the link instead of pointing at a missing id.
- `--mc-content-width` and `--mc-content-height` are the content's
  natural size: the core measures with the height cap lifted, so a
  surface capped on one open flips and sizes correctly on the next.
- Submenus continue in their parent's direction. A submenu that
  fits on either side opens on the side its parent opened on; one
  that lacks room turns to the other side, and the levels below
  continue that way. Before, every submenu defaulted to the inline
  end, so deep menus zigzagged even with room.
- Keyboard moves in a menu (arrows, Home, End, typeahead, an open
  onto the first or last item) scroll the item just into view with
  `scrollIntoView({ block: "nearest" })`, the same in every
  browser; native focus scrolling centered a jumped-to item in
  Chromium. The pointer still never scrolls. A menu's
  `scroll-padding-block` keeps a row scrolled into view at its
  resting inset.
- Menu's Required CSS keeps a submenu's first item level with its
  trigger, and moves it up only as far as it must to fit.
- Sizes, gzipped, against 0.17.0: the combined `monochrome` entry
  is 3934 B (+504 B) and the router 1549 B (+227 B). Each
  standalone component, with the shared chunk: accordion 1153 B
  (+155 B), collapsible 826 B (+164 B), dialog 992 B (+200 B), menu
  and menubar 2785 B (+377 B), popover 1185 B (+178 B), tabs
  1170 B (+161 B), tooltip 1155 B (+148 B). They grow for
  placement sides, viewport fitting, menu groups, keyboard
  scrolling, and dialog focus. The shared `dist/dom.js` is an
  internal chunk with minified export names, and `dist/dom.d.ts` is
  no longer shipped; it was never a public export.

### Fixed

- Accordion, Menu, and Tabs skip a hidden item (`hidden`,
  `display: none`) while roving instead of stopping on it.
- Menu keys work after a mouse open in Safari, where focus rests
  on an ancestor of the trigger (`body`, a popover, a `dialog`).
- Menu keys work after the highlighted item is removed from the
  document.
- Popover: Escape in a dialog opened from the popover closes only
  the dialog; clicking the trigger again closes it in Safari; a
  popover removed while open no longer takes a later Escape.
- Tooltip: moving the pointer from the trigger onto the tooltip no
  longer hides it (WCAG 1.4.13). The tooltip's Required CSS
  bridges the gap between them.
- Router: a link clicked from a scrolled page opens the new page at
  the top (or its `#fragment`) in Safari, which could keep the old
  offset and paint a fixed header inside the swapped root
  offscreen.
- Router: a click paints before the router parses and swaps a
  prefetched page. The swap used to run before that first paint and
  count toward the click's Interaction to Next Paint; on a slow
  phone it was most of it. It pays off when the click itself
  changes something on screen, such as a sidebar's current-page
  mark; a click that paints nothing waits for the swap's paint
  (`spec/router.md`).

## 0.17.0 (2026-09-23)

### Added

- Menubar: the tab stop moves with focus, so Tab back into the bar
  lands on the item used last.
- Router: viewport prefetch arms on the first interaction, and a
  pressed link is prefetched first.

### Fixed

- Dialog: opens again after an open dialog was removed from the
  document.
- Router: a pointer resting on a link no longer arms prefetch.

## 0.16.0 (2026-09-22)

### Added

- The browser floors in `package.json` `browserslist` are checked
  on every build; the source cannot use an API past them.

### Fixed

- Router: a click on an element inside a link, such as an icon,
  navigates in place.

## 0.15.0 (2026-09-21)

### Fixed

- Menu: focusing an item with the pointer no longer scrolls the
  page.
- Menu: an item with `href` navigates once per click.
- Dialog: closing no longer moves focus when it is already on the
  trigger.

## 0.14.0 (2026-09-21)

### Added

- Router: prefetches same-origin links as they enter the viewport.

## 0.13.0 (2026-09-18)

### Upgrade

1. React and Vue parts: rename initial-state props to their
   `default` names: `open` to `defaultOpen`, `selected` to
   `defaultSelected`, `checked` to `defaultChecked`.
2. Accordion: remove `data-mode`. Every accordion is exclusive;
   use collapsibles for sections that open independently.
3. Remove `aria-hidden` from closed content; `hidden`, a closed
   popover, or a closed `dialog` already hides it.

### Breaking

- Accordion is always exclusive: opening one item closes the
  others. The header may be any of `h2` to `h6`.
- The router runs on the Navigation API (Baseline 2026). Where it
  is missing, `import "monochrome/router"` does nothing and links
  do full page loads.

### Changed

- The core never writes `aria-hidden`.
- The React parts need React 19.

Older releases: https://github.com/vaneenige/monochrome-ui/tags
