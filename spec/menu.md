---
title: Menu
description: A button that opens a list of actions, with submenus, checkboxes, and radio groups.
---

# Menu

A menu is a button that opens a list of actions or options in the
top layer. Items can be buttons, links, checkboxes, or radio
groups, and any item can open a submenu. It implements the
WAI-ARIA Menu Button and Menu patterns: arrow keys rove, Home and
End jump, a printable character jumps to the next item starting
with it, and Escape closes one level. Pointer support includes
press-drag-release, hover-to-open submenus, and a safety triangle
so a diagonal move toward a submenu does not close it. For a
horizontal bar of menus, see [Menubar](menubar.md).

## Anatomy

```html
<button type="button" id="mct:menu:file" aria-controls="mcc:menu:file" aria-expanded="false" aria-haspopup="menu" role="button">
  File
</button>
<ul id="mcc:menu:file" role="menu" aria-labelledby="mct:menu:file" popover="manual">
  <li role="none">
    <button type="button" role="menuitem" tabindex="-1">New file</button>
  </li>
  <li role="none">
    <a href="/recent" role="menuitem" tabindex="-1">Open recent</a>
  </li>
  <li role="none">
    <span role="menuitem" tabindex="-1" aria-disabled="true">Revert</span>
  </li>
  <li role="none">
    <button type="button" id="mct:menu:file-share" aria-controls="mcc:menu:file-share" aria-expanded="false" aria-haspopup="menu" role="menuitem" tabindex="-1">
      Share
    </button>
    <ul id="mcc:menu:file-share" role="menu" aria-labelledby="mct:menu:file-share" popover="manual">
      <li role="none">
        <button type="button" role="menuitem" tabindex="-1">Copy link</button>
      </li>
      <li role="none">
        <button type="button" role="menuitem" tabindex="-1">Email</button>
      </li>
    </ul>
  </li>
  <li role="separator"></li>
  <li role="none">
    <button type="button" role="menuitemcheckbox" aria-checked="true" tabindex="-1">Autosave</button>
  </li>
  <li role="separator"></li>
  <li role="none">
    <ul role="group" aria-labelledby="mcc:menu-label:file-theme">
      <li role="presentation" id="mcc:menu-label:file-theme">Theme</li>
      <li role="none">
        <button type="button" role="menuitemradio" aria-checked="true" tabindex="-1">Light</button>
      </li>
      <li role="none">
        <button type="button" role="menuitemradio" aria-checked="false" tabindex="-1">Dark</button>
      </li>
    </ul>
  </li>
</ul>
```

Each child of the `role="menu"` list is one `li`: `role="none"`
wrapping one item or one group (as its first element),
`role="separator"`, or `role="presentation"` for a label. A group
is a `ul role="group"` named by `aria-labelledby`, usually its own
label `li`, or by `aria-label`; its children follow the same
rules. Screen readers announce the group's name
with its items, and radio items inside it are one set. A submenu
is an item that is also a `mct:menu:` trigger, with its own
`role="menu"` list, usually inside the same `li`. The menu list can
sit anywhere in the document; the trigger finds it through
`aria-controls`, and the list finds the trigger through
`aria-labelledby`.

## Parts

`npx monochrome add menu` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- Item props, a class included, land on the item element, not on
  its `li`. A click handler (`onClick`, `@click`) runs for pointer
  and keyboard activation alike.
- `defaultChecked` is the initial value; read the live value from
  `aria-checked`.
- `keepOpen` renders `data-mc-keep-open`, so the menu stays open
  when the item activates.
- A disabled item renders a `span` without `href` or click handler,
  so it can neither navigate nor run its handler.
- `Menu.Sub` holds a submenu's trigger and popover. `Menu.Group`
  holds items that belong together, named by `label` (rendered as a
  `Menu.Label`) or by `aria-label`; its other props land on the
  `ul`, and radio items in it are one set.

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Trigger | `mct:menu:ID` | `<button type="button">`, `role="button"`, `aria-haspopup="menu"`, `aria-expanded="false"`, `aria-controls` | `aria-expanded` |
| Menu list | `mcc:menu:ID` | `<ul>`, `role="menu"`, `popover="manual"`, `aria-labelledby` (the trigger) | open state, `--mc-trigger-top` to `--mc-available-height`, `data-mc-x`, `data-mc-y` |
| Item wrapper | none | `li role="none"`, the item as its first element | nothing |
| Item | none | `role="menuitem"`, `tabindex="-1"`; `<button type="button">`, `<a href>`, or `<span>` when disabled | `data-mc-highlighted` |
| Checkbox item | none | `role="menuitemcheckbox"`, `aria-checked`, `tabindex="-1"` | `aria-checked`, `data-mc-highlighted` |
| Radio item | none | `role="menuitemradio"`, `aria-checked`, `tabindex="-1"` | `aria-checked`, `data-mc-highlighted` |
| Kept-open item | none | any item above plus `data-mc-keep-open` (no value): activating it leaves the menu open | as that item |
| Submenu trigger | `mct:menu:ID` | as Trigger but `role="menuitem"` and `tabindex="-1"` | `aria-expanded`, `data-mc-highlighted` |
| Separator | none | `li role="separator"` | nothing |
| Group | none | `li role="none"` with a `ul role="group"` as its first element, named by `aria-labelledby` (its label) or `aria-label` | nothing |
| Label | any unique id when it names a group (`mcc:menu-label:ID` in the parts) | `li role="presentation"` | nothing |

Optional: `aria-disabled="true"` on a trigger or item.

**Radio items form sets.** Activating a radio item checks it and
unchecks every other radio item in its set: the unbroken run of
`menuitemradio` siblings around it. Any other child (a separator,
a label, a plain item, a group) ends a run, and so do the start
and end of a list. A group is a list of its own, so its radio
items are one set, and a radio item outside it never touches them.
Give each set a group: it bounds the set and names it for screen
readers.

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space, ArrowDown on the trigger | Open and focus the first enabled item |
| ArrowUp on the trigger | Open and focus the last enabled item |
| Enter, Space on the trigger of an open menu | Close it |
| ArrowDown, ArrowUp | Move to the next or previous enabled item, wrapping |
| Home, End | First or last enabled item |
| A printable character | Next enabled item whose text starts with it; press again to cycle |
| Enter, Space on an item | Activate it (toggle a checkbox, select a radio) and close every menu |
| Space on a checkbox or radio | Toggle or select it; the menu stays open, so several can change in a row |
| Enter, Space on an item with `data-mc-keep-open` | Activate it; the menu stays open |
| Enter on a link item | Follow the link and close the menu; Space closes the menu without following it, as links don't activate on Space |
| Enter, Space, ArrowRight on a submenu trigger | Open the submenu and focus its first item |
| ArrowLeft inside a submenu | Close the submenu, focus its trigger |
| Escape | Close the innermost open menu, focus its trigger |
| Tab, Shift+Tab | Close every menu and move on from the root trigger |

Every key skips disabled and hidden items, labels, and separators,
and moves through a group's items as if they sat in the menu: Home
and End reach the first and last item of the whole menu.

## Pointer

- Press the trigger to open (on `pointerdown`, not `click`); press
  it again to close.
- Click an item, or press, drag to it, and release: activates it
  and closes every menu, whatever its role. An item with
  `data-mc-keep-open` leaves the menu open.
- Hovering an item focuses it and marks it `data-mc-highlighted`.
  Hovering a submenu trigger opens its submenu; hovering a sibling
  closes it.
- Moving diagonally from a submenu trigger toward its submenu keeps
  it open while the pointer stays inside the triangle to the
  submenu's near edge and keeps moving toward it.
- A press outside every open menu closes all menus. A scroll
  inside a menu closes only the submenus opened from it; any other
  scroll closes all menus. Resizing the window repositions them.

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[role="menu"]:popover-open`: an open menu.
- `[role^="menuitem"][data-mc-highlighted]`: the current item. Use
  it, not `:hover`, so hover and keyboard never show two
  highlights.
- `[aria-checked="true"]`, `[aria-disabled="true"]`: item state.
- `[id^="mct:menu:"][aria-expanded="true"]`: an open trigger or
  submenu trigger.
- `data-mc-side` (`top`, `right`, `bottom`, `left`) and
  `data-mc-align` (`start`, `center`, `end`): you write them on the
  content to pick the side of the trigger it opens on and where it
  lines up along it. Default: below, its items' leading edges on the
  trigger's; a submenu beside its trigger, on the side its parent
  menu opened on. The core writes the side it actually opened on
  (`data-mc-y` or `data-mc-x`, flipped when it does not fit) and the
  variables the Required CSS places from
  ([Positioning](styling.md#positioning)).

### Required

Copy this into the project's global CSS as it is. Without it, the
menu opens in the middle of the screen, not at its trigger. It only
places the menu, in `@layer components`, so the project's own styles
win ([Layers](styling.md#layers)).

```css
@layer components {
  /* Placed from what the core writes: the trigger rect, the menu's
     size, and the side it opened on (data-mc-y, data-mc-x). Every
     placement keeps 0.5rem inside the viewport. --_offset is the gap
     to the trigger. Give the menu a padding? Set --_inset to it too,
     and its items still line up with the trigger. */
  [id^="mcc:menu:"] {
    --_offset: 0.25em;
    /* The height it may take: its own, or when it is too tall for
       the room on its side, that room less the offset and a margin.
       (The product is huge while it fits, so max() picks its own.) */
    --_max: max(
      var(--mc-available-height) - var(--_offset) - 0.5rem,
      var(--mc-content-height) + (var(--mc-available-height) - var(--mc-content-height)) * 1000
    );
    position: fixed;
    inset: auto;
    /* Below, its items' left edges on the trigger's: side bottom and
       align start, the defaults. */
    top: calc(var(--mc-trigger-bottom) + var(--_offset));
    left: clamp(0.5rem, var(--mc-trigger-left) - var(--_inset, 0px), 100vw - var(--mc-content-width) - 0.5rem);
    box-sizing: border-box;
    max-width: calc(100vw - 1rem);
    max-height: var(--_max);
    overflow-x: hidden;
    overflow-y: auto;
    /* A wheel past its end would scroll the page, which closes it. */
    overscroll-behavior: contain;
    /* The list's and the popover's own margin, padding, and bullets. */
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Above, its bottom edge on the trigger's, however tall it is. */
  [id^="mcc:menu:"][data-mc-y="top"] {
    top: calc(var(--mc-trigger-top) - var(--_offset) - min(var(--mc-content-height), var(--_max)));
  }
  /* Beside, it moves up or down to stay inside the viewport, over its
     trigger's menu if need be, and scrolls when taller than it. */
  [id^="mcc:menu:"][data-mc-x] {
    --_max: calc(100dvh - 1rem);
  }
  [id^="mcc:menu:"][data-mc-x="right"] {
    left: min(var(--mc-trigger-right) + var(--_offset), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-x="left"] {
    left: max(0.5rem, var(--mc-trigger-left) - var(--_offset) - var(--mc-content-width));
  }
  /* Along a top or bottom side (data-mc-align): start and end follow
     the text direction, so start is the right edge on a right-to-left
     page. The :dir() rules stand alone: a browser without :dir()
     drops only them. */
  [id^="mcc:menu:"][data-mc-y][data-mc-align="end"] {
    left: clamp(0.5rem, var(--mc-trigger-right) + var(--_inset, 0px) - var(--mc-content-width), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-y][data-mc-align="start"] {
    left: clamp(0.5rem, var(--mc-trigger-left) - var(--_inset, 0px), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-y]:dir(rtl),
  [id^="mcc:menu:"][data-mc-y][data-mc-align="start"]:dir(rtl) {
    left: clamp(0.5rem, var(--mc-trigger-right) + var(--_inset, 0px) - var(--mc-content-width), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-y][data-mc-align="end"]:dir(rtl) {
    left: clamp(0.5rem, var(--mc-trigger-left) - var(--_inset, 0px), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-y][data-mc-align="center"] {
    left: clamp(0.5rem, (var(--mc-trigger-left) + var(--mc-trigger-right) - var(--mc-content-width)) / 2, 100vw - var(--mc-content-width) - 0.5rem);
  }
  /* Along a left or right side: its first item level with the
     trigger (start, the default), centered on it, or its last item
     level with it (end). */
  [id^="mcc:menu:"][data-mc-x],
  [id^="mcc:menu:"][data-mc-x][data-mc-align="start"] {
    top: clamp(0.5rem, var(--mc-trigger-top) - var(--_inset, 0px), 100dvh - var(--mc-content-height) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-x][data-mc-align="center"] {
    top: clamp(0.5rem, (var(--mc-trigger-top) + var(--mc-trigger-bottom) - var(--mc-content-height)) / 2, 100dvh - var(--mc-content-height) - 0.5rem);
  }
  [id^="mcc:menu:"][data-mc-x][data-mc-align="end"] {
    top: clamp(0.5rem, var(--mc-trigger-bottom) + var(--_inset, 0px) - var(--mc-content-height), 100dvh - var(--mc-content-height) - 0.5rem);
  }
  /* A submenu sits flush on its parent menu. */
  [id^="mcc:menu:"] [id^="mcc:menu:"] {
    --_offset: 0px;
  }
  [id^="mcc:menu:"] [role="group"] {
    margin: 0;
    padding: 0;
    list-style: none;
  }
}
```

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
[id^="mcc:menu:"] {
  /* A surface over the page: a fill, an outline, and text that does
     not inherit the trigger's. */
  border: 0;
  background: Canvas;
  box-shadow:
    0 0 0 1px color-mix(in srgb, currentColor 15%, Canvas),
    0 8px 24px rgb(0 0 0 / 0.12);
  color: CanvasText;
  line-height: 1.5;
  letter-spacing: normal;
  text-align: start;
  text-transform: none;
  white-space: normal;
}
/* The current item, for the pointer and the keyboard alike: use
   data-mc-highlighted, not :hover, so the two never show two
   highlights. */
[id^="mcc:menu:"] [role^="menuitem"][data-mc-highlighted] {
  background-color: color-mix(in srgb, currentColor 8%, transparent);
}
[id^="mcc:menu:"] [role^="menuitem"][aria-disabled="true"] {
  opacity: 0.6;
}
/* The state of a checkbox or radio item: nothing else shows it. */
[id^="mcc:menu:"] :is([role="menuitemcheckbox"], [role="menuitemradio"])::before {
  content: "";
  display: inline-block;
  width: 1em;
  text-align: center;
}
[id^="mcc:menu:"] [role="menuitemcheckbox"][aria-checked="true"]::before {
  content: "\2713";
}
[id^="mcc:menu:"] [role="menuitemradio"][aria-checked="true"]::before {
  content: "\2022";
}
[id^="mct:menu:"]:not([role="menuitem"])[aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
/* The highlight is too faint to be the only focus cue (WCAG 1.4.11),
   so keyboard focus also draws a ring, inside the item. */
[id^="mcc:menu:"] [role^="menuitem"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
[id^="mct:menu:"]:not([role="menuitem"]):focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Accessibility

- The trigger is announced as a menu button (`aria-haspopup`,
  `aria-expanded`), and the list as a menu named after it.
- Items carry `tabindex="-1"`: the menu is one tab stop, entered
  with the arrow keys or Enter, and Tab leaves it.
- Focus is never left on the list itself or on `body`; a stray key
  lands on the highlighted item.
- Disabled items stay in the menu and are announced as unavailable
  when a screen reader reads the list; the keys skip them (see
  [Conventions](conventions.md#design-choices)). A disabled link
  still navigates on a pointer click, so render disabled items as a
  `<span>` without `href`.
- Checkbox and radio items announce `aria-checked`, which the core
  keeps current.
- A group is announced by its name as focus enters it, so a
  listener hears "Theme" before "Light". A label outside a group
  is visual only: it is not tied to the items after it.

## Design choices

- **Opens on press.** A trigger opens on `pointerdown`, not
  `click`, and press, drag, release activates an item, like a
  native menu.
- **Single-character typeahead.** Each key jumps to the next item
  starting with that character; there is no timed buffer for
  words, because the core has no timers.
- **Hover moves focus.** The hovered item takes focus and
  `data-mc-highlighted`, so pointer and keyboard always agree on
  one current item.
- **Submenus open on hover, without a delay.** The safety triangle
  keeps a submenu open while the pointer heads for it, instead of
  a timer.
- **Flip, then scroll; never cover the trigger.** A menu opens
  below, above when only that side has room, and when neither side
  does, on the larger one, capped and scrolling. It never moves over
  its trigger: the press that opened it would land on an item, and
  release would activate it.
- **Submenus continue in their parent's direction.** A submenu opens
  on the side its parent opened on, and turns only when that side
  lacks room. When a chain runs out of room both ways it turns back
  over its parents, as native menus do.
- **Keep submenus to two levels.** Deeper chains do not fit narrow
  screens anywhere, and each level is one more hover path to aim.
- **The keyboard scrolls to the nearest edge.** In a capped menu,
  arrows, Home, End, and typeahead scroll just far enough to show the
  focused item, never centering it; the pointer never scrolls.
- **Every item closes the menu.** Click, press-drag-release, and
  Enter activate an item and close every menu, checkbox and radio
  items included. Native menus do the same (View › Show Toolbar
  closes the menu on macOS and Windows), and a radio pick is a
  finished choice: leaving the menu open only costs a click to
  dismiss it. One rule also reads the same for every item, with no
  exception by role to remember. The one exception is APG's: Space
  on a checkbox or radio item changes its state and leaves the
  menu open, so a keyboard user can change several in one visit.
- **Staying open is opt-in and visible.** A menu that should stay
  open for an item (a columns picker, Zoom in) says so in the
  markup with `data-mc-keep-open` (`keepOpen` on the parts), for
  every activation.
- **Ungrouped radios still work as runs of siblings**, so markup
  written before groups keeps its behaviour. New menus should
  group each radio set.

## Common mistakes

- Omitting `role="button"` on a standalone trigger. The core reads
  it to decide that Enter toggles and that Home, End, and typeahead
  work while open. Fix: `role="button"` on root triggers,
  `role="menuitem"` on submenu and menubar triggers.
- Putting the item directly in the `ul`, or anything before it in
  its `li`. Roving reads each `li`'s first element. Fix:
  `li role="none"` with the item as its first child.
- Missing `aria-labelledby` on the list. Hover and submenu paths
  resolve the trigger through it. Fix: point it at the trigger id.
- Using `popover` or `popover="auto"`. The browser would close it on
  its own and leave `aria-expanded` stale. Fix: `popover="manual"`.
- Calling `trigger.click()` to open it. Menu opens on `pointerdown`
  and keys, not `click`. Fix: let the reader open it; for tests,
  dispatch a `pointerdown` or press Enter on the focused trigger.
- Expecting a checkbox or radio item to keep the menu open on
  click or Enter. Every item closes it; only Space toggles in
  place. Fix: `data-mc-keep-open` on the item (`keepOpen` on the
  parts), or on every item of a set that should stay open.
- Writing `data-mc-keep-open="false"` (or `data-mc-keep-open={false}`
  in JSX, which renders `"false"`) to let an item close. The
  attribute is read by presence, so any value keeps the menu open.
  Fix: leave it off, or use the `keepOpen` prop.
- Expecting radio items across a separator to be one set. Fix:
  wrap each set in a group (`Menu.Group` with the parts).
- Putting `role="group"` on the `li`, or the group `ul` straight
  in the menu list. Roving reads each `li`'s first element. Fix:
  `li role="none"` with the `ul role="group"` as its first child.
- A group with no name, or a label outside the group. Screen
  readers then announce nothing with its items. Fix: the label
  `li` first in the group and `aria-labelledby` on the `ul`
  pointing at it, or `aria-label` on the `ul`.
- Rendering the `<dialog>` an item opens inside the menu list. The
  menu closes as the item activates and hides the dialog with it.
  Fix: render the dialog outside the menu (see [Dialog](dialog.md)).
- Styling `[role="menu"]` with `display: flex` unconditionally. It
  overrides the closed popover rule. Fix: put `display` under
  `:popover-open`, or keep the list as a block.
