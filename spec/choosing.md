---
title: Choosing a component
description: Which monochrome component fits which job, with a quick decision table.
---

# Choosing a component

monochrome has eight components. Most confusion is between the four
that open a surface (Dialog, Menu, Popover, Tooltip) and the three
that reveal content in place (Accordion, Collapsible, Tabs). Pick by
what the reader does with the thing that appears.

## All components

| Component | One line |
| --- | --- |
| [Accordion](accordion.md) | Headed sections where opening one closes the others |
| [Collapsible](collapsible.md) | One button that shows and hides one region |
| [Dialog](dialog.md) | A modal window for a task or decision; the page behind is inert |
| [Menu](menu.md) | A list of actions or options, with submenus, checkboxes, and radios |
| [Menubar](menubar.md) | A horizontal bar of menus and links, one tab stop |
| [Popover](popover.md) | A non-modal panel with any interactive content, anchored to a button |
| [Tabs](tabs.md) | Switch between panels that share one place, one visible at a time |
| [Tooltip](tooltip.md) | A short text description on hover and focus, never interactive |

Plus the optional [Router](router.md) for in-place page swaps.

## Quick decision

| If the reader needs to | Use |
| --- | --- |
| Pick one action from a list (Edit, Duplicate, Delete) | Menu |
| Toggle settings or pick one option inside a list of commands | Menu with checkbox or radio items |
| Fill a small form, share a link, pick a color, next to a button | Popover |
| Confirm, or finish a task, before doing anything else | Dialog |
| Read a hint about a control | Tooltip |
| Show or hide one block of extra detail | Collapsible |
| Read one of several sections, with the others folded away | Accordion |
| Switch between views of equal weight in one spot | Tabs |
| Navigate an app or site through a row of dropdowns | Menubar |

## Popover, Menu, Dialog, or Tooltip

- **Menu** when the content is a list of commands or choices. It
  brings roving focus, typeahead, submenus, and checked items.
  Every item does something; there are no inputs.
- **Popover** when the content is anything else interactive: inputs,
  several buttons, links in a layout. It is non-modal and closes
  when the reader moves on.
- **Dialog** when the reader must deal with the content before
  returning to the page: confirmation, a multi-field form, a
  destructive action. It is modal; the page behind is inert.
- **Tooltip** when the content is a short label or hint with nothing
  to click. If it would need a link or a button, it is a Popover.

A menu item can open a dialog (give the item the `mct:dialog-open:`
id), and a popover can contain a menu. A dialog can contain any
other component, but not a second dialog.

## Accordion or Collapsible

- **Accordion** when the sections form one group and only one should
  be open at a time (an FAQ, a settings sidebar). It adds arrow-key
  movement between headers.
- **Collapsible** when each block is independent and several may be
  open at once, or when there is just one ("Show more", an advanced
  options panel).

## Tabs or Accordion

- **Tabs** when the panels are peers the reader switches between,
  the labels are short, and there is horizontal room. Exactly one
  panel is always visible.
- **Accordion** when space is narrow (mobile), labels are long, or it
  is fine for everything to be folded. Sections stack vertically.

## Menubar or Menu

- **Menubar** for a persistent row of several menus (File, Edit,
  View) or top-level navigation with dropdowns. The bar is one tab
  stop and arrows move along it.
- **Menu** for a single button that opens actions: a "More" button,
  a row's action menu, a user avatar menu.
- A row of links without dropdowns is neither: use a plain `<nav>`.

## Not in monochrome

Selects, comboboxes, date pickers, toasts, and sliders are not part
of the library. Use native elements where they fit: `<select>`,
`<input type="date">`, `<input type="range">`.
