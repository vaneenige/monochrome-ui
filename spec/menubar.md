---
title: Menubar
description: A horizontal bar of menus and links that behaves as one tab stop.
---

# Menubar

A menubar is a horizontal row of menu triggers and plain items, like
the File, Edit, View bar of a desktop app or a site's main
navigation with dropdowns. It implements the WAI-ARIA Menubar
pattern: the bar is a single tab stop, ArrowLeft and ArrowRight
move along it, and once a menu is open, moving along the bar opens
the neighbour's menu instead. Every menu inside it is a regular
[Menu](menu.md), with the same items, submenus, checkboxes,
radio items, and groups.

## Anatomy

```html
<ul role="menubar" aria-label="Main">
  <li role="none">
    <a href="/" role="menuitem" tabindex="0">Home</a>
  </li>
  <li role="none">
    <button type="button" id="mct:menu:products" aria-controls="mcc:menu:products" aria-expanded="false" aria-haspopup="menu" role="menuitem" tabindex="-1">
      Products
    </button>
    <ul id="mcc:menu:products" role="menu" aria-labelledby="mct:menu:products" popover="manual">
      <li role="none">
        <a href="/chat" role="menuitem" tabindex="-1">Chat</a>
      </li>
      <li role="none">
        <a href="/video" role="menuitem" tabindex="-1">Video</a>
      </li>
    </ul>
  </li>
  <li role="none">
    <button type="button" id="mct:menu:docs" aria-controls="mcc:menu:docs" aria-expanded="false" aria-haspopup="menu" role="menuitem" tabindex="-1">
      Docs
    </button>
    <ul id="mcc:menu:docs" role="menu" aria-labelledby="mct:menu:docs" popover="manual">
      <li role="none">
        <a href="/docs/start" role="menuitem" tabindex="-1">Getting started</a>
      </li>
      <li role="none">
        <a href="/docs/api" role="menuitem" tabindex="-1">API reference</a>
      </li>
    </ul>
  </li>
</ul>
```

Bar items are exactly `ul[role=menubar]`, then `li role="none"`,
then the item with `role="menuitem"`. Exactly one bar item has
`tabindex="0"`: the one Tab lands on first. Every other bar item
has `tabindex="-1"`. A trigger's menu list can also live outside
the bar; the core follows `aria-controls` and `aria-labelledby`.

## Parts

`npx monochrome add menubar` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- Name the bar with `aria-label` on `Menubar.Root`.
- Bar-level triggers and items default to `tabindex="-1"`. Give
  exactly one of them `tabindex` 0 (`tabIndex={0}` in React,
  `:tabindex="0"` in Vue), normally the first.
- The menubar parts build on the menu parts, so `add menubar`
  writes both; everything inside a bar menu is as in
  [Menu](menu.md).

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Bar | none | `<ul>`, `role="menubar"`, a name (`aria-label`) | nothing |
| Bar item wrapper | none | `li role="none"`, direct child of the bar | nothing |
| Bar trigger | `mct:menu:ID` | `<button type="button">`, `role="menuitem"`, `aria-haspopup="menu"`, `aria-expanded="false"`, `aria-controls`, `tabindex` | `aria-expanded`, `tabindex`, `data-mc-highlighted` |
| Bar link or button | none | `role="menuitem"`, `tabindex` | `tabindex`, `data-mc-highlighted` |
| Menu list | `mcc:menu:ID` | as in [Menu](menu.md) | as in Menu |


## Keyboard

| Key | Action |
| --- | --- |
| ArrowRight, ArrowLeft on a bar item | Next or previous bar item, wrapping; if a menu was open, open that item's menu |
| ArrowDown, Enter, Space on a bar trigger | Open its menu and focus the first item |
| ArrowUp on a bar trigger | Open its menu and focus the last item |
| Home, End, a printable character on a bar item | First, last, or next matching bar item |
| ArrowRight, ArrowLeft inside a menu | Close it, focus the neighbouring bar item, and open its menu (ArrowRight on a submenu trigger opens the submenu, ArrowLeft in a submenu closes it) |
| Escape | Close the innermost menu, focus its trigger |
| Tab, Shift+Tab | Close every menu and leave the bar |

Everything inside an open menu works as in [Menu](menu.md). With
`dir="rtl"` on `html`, ArrowLeft and ArrowRight swap.

## Pointer

- Pressing a bar trigger opens its menu; pressing it again closes it.
- While a bar menu is open, hovering another bar trigger switches to
  its menu, and hovering a plain bar item (a link or button without
  a menu) closes it.
- Everything else (drag to select, hover submenus, the safety
  triangle, outside press, scroll) is as in [Menu](menu.md).

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[role="menubar"]`: the bar.
- `[role="menubar"] > li > [role="menuitem"]`: bar items.
- `[role="menubar"] [aria-expanded="true"]`: the trigger whose menu
  is open.
- `[data-mc-highlighted]`: the current item, on the bar and in menus.
- Its menus are [Menu](menu.md) lists: they need Menu's
  [Required CSS](menu.md#required) and take its hooks.

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
/* A row of items, without the list's bullets and indent. */
[role="menubar"] {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}
/* The current item, and the one whose menu is open: use
   data-mc-highlighted, not :hover. */
[role="menubar"] > li > :is([data-mc-highlighted], [aria-expanded="true"]) {
  background-color: color-mix(in srgb, currentColor 8%, transparent);
}
[role="menubar"] > li > [aria-disabled="true"] {
  opacity: 0.6;
}
[role="menubar"] > li > [role="menuitem"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
```

## Accessibility

- Give the bar a name with `aria-label` ("Main", "Editor").
- The bar is one tab stop, so a long navigation does not cost
  keyboard users a Tab press per link.
- Plain links on the bar are fine; they use `role="menuitem"` and
  follow their `href` on Enter.
- Use a menubar for app-like command bars and dropdown navigation.
  A simple list of links is better as a plain `<nav>`.

## Design choices

- **The tab stop follows focus.** Whichever bar item takes focus
  (arrow keys, a click, a hover, a script `focus()`) becomes the
  only `tabindex="0"`, so Tab back into the bar lands on the item
  used last.
- **Horizontal only.** The bar reads ArrowLeft and ArrowRight; a
  vertical list of menus is a set of [Menu](menu.md) buttons.
- Everything inside a menu, including the skipped disabled items,
  is as in [Menu](menu.md#design-choices).

## Common mistakes

- No bar item with `tabindex="0"`, or more than one. A bar with
  none is skipped by Tab, without a warning. Fix: exactly one,
  normally the first (`tabIndex={0}` in React, `:tabindex="0"` in
  Vue).
- Extra wrappers between the bar and the items (`ul, div, li`).
  Arrow keys and the tab stop only see
  `ul[role=menubar] > li > [role=menuitem]`. Fix: keep that exact
  shape.
- `role="button"` on bar triggers. Fix: `role="menuitem"`; only
  standalone menu triggers use `role="button"`.
- Using `menubar` for tabs. A menubar opens menus and runs actions;
  switching panels is [Tabs](tabs.md).
