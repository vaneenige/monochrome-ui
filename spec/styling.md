---
title: Styling
description: How to style monochrome with the project's own styles, in CSS, Tailwind, or StyleX, and the placement CSS menus, popovers, and tooltips require.
---

# Styling

monochrome ships no CSS. The core is JavaScript only: it reads and
writes ARIA, a few `data-mc-*` attributes, and, on surfaces, the
variables that place them. The project styles those in its own
system, so a component looks like the rest of the project from the
start. A selector like `[aria-expanded="true"]` is always in sync
with what a screen reader hears; there are no class names to learn.

## What to style

Three jobs, per component:

1. **Required CSS** (Menu, Popover, Tooltip, and Menubar's menus):
   placement. Copy it from the component's spec into the project's
   global CSS, as it is. Without it a surface opens where the
   browser puts a popover, in the middle of the screen, not at its
   trigger. It sets nothing of a look.
2. **States**: every state a user must see. Nothing shows the
   selected tab, the highlighted menu item, or a checked item until
   the project styles it.
3. **The look**: sizes, spacing, colors, radii. All the project's.

| Component | Required CSS | States to style |
| --- | --- | --- |
| Accordion | none | the open header `[aria-expanded="true"]`, a disabled one |
| Collapsible | none | the open trigger `[aria-expanded="true"]`, a disabled one |
| Dialog | none (give the dialog `outline: none`) | the surface, `::backdrop` |
| Menu | [yes](menu.md#required) | the surface, the current item `[data-mc-highlighted]`, checked items `[aria-checked="true"]`, disabled items |
| Menubar | [Menu's](menu.md#required), for its menus | the current item `[data-mc-highlighted]`, the open item `[aria-expanded="true"]` |
| Popover | [yes](popover.md#required) | the surface, the open trigger `[aria-expanded="true"]` |
| Tabs | none | the selected tab `[aria-selected="true"]`, disabled tabs |
| Tooltip | [yes](tooltip.md#required) | the surface |

Each component's spec has a Styling section: its hooks, its
Required CSS, and an Example that styles every state in plain CSS.
Adapt the Example to the project; copy the Required CSS as it is.

The browser already draws some of it: a popover, a menu, a tooltip,
and a dialog get a `Canvas` fill, `CanvasText`, and a solid border;
a modal dialog gets a dim `::backdrop`; focused controls get a
focus ring. Restyle them; never remove a focus ring without drawing
one ([Focus](#focus)).

## State selectors

| Selector | Matches |
| --- | --- |
| `[aria-expanded="true"]` | An open Accordion, Collapsible, Menu, or Popover trigger |
| `[aria-selected="true"]` | The selected tab |
| `[aria-checked="true"]` | A checked menu checkbox or radio item |
| `[aria-disabled="true"]` | A disabled trigger, tab, or menu item |
| `[data-mc-highlighted]` | The current menu or menubar item (hover and keyboard) |
| `:popover-open` | An open Menu, Popover, or Tooltip surface |
| `dialog[open]` | An open Dialog |
| `::backdrop` | The layer behind an open Dialog |
| `[hidden]` | A closed Accordion or Collapsible panel, an unselected tab panel |

Use `[data-mc-highlighted]` for the menu highlight, not `:hover`. The
core moves it with both pointer and keyboard, so the two can never
show different items.

## In the project's styles

Target a part by role (`[role="menu"]`, `[role="tab"]`) or by id
prefix (`[id^="mct:accordion:"]`, `[id^="mcc:popover:"]`), or put a
class on it: the core ignores classes. Every part takes a class
(`className` in React, `class` in Vue) and passes it to its
element.

**Plain CSS, CSS modules, Sass.** Attribute selectors on a class of
your own:

```css
.tab[aria-selected="true"] {
  border-bottom: 2px solid;
}
.menu-item[data-mc-highlighted] {
  background: var(--accent);
}
```

**Tailwind.** Its `aria-*` and `data-*` variants select the same
state:

```tsx
<Tabs.Tab className="px-3 py-1 aria-selected:bg-muted aria-disabled:opacity-50" />
<Menu.Item className="rounded px-2 py-1 data-[mc-highlighted]:bg-accent" />
<Menu.CheckboxItem className="aria-checked:font-medium" />
<Popover.Content className="rounded-lg border bg-popover p-4 shadow-md" />
```

Put the Required CSS in the stylesheet that imports Tailwind,
after `@import "tailwindcss"`. It is in `@layer components`, below
Tailwind's utilities, so a utility on the content still wins.

**StyleX.** Spread `stylex.props(...)` on a part (it passes
`className` and `style` through to its element), and key state on
the same attributes with StyleX conditions:

```ts
const styles = stylex.create({
  item: {
    backgroundColor: {
      default: "transparent",
      "[data-mc-highlighted]": "color-mix(in srgb, currentColor 8%, transparent)",
    },
    opacity: { default: 1, "[aria-disabled='true']": 0.6 },
  },
});

<Menu.Item {...stylex.props(styles.item)}>Rename</Menu.Item>
```

Where a part's look depends on its place (a menu trigger on a
menubar, in a submenu, or on its own), pick the styles from context
in JavaScript, the StyleX way, rather than from an ancestor
selector. Keep the Required CSS as plain CSS in the project's global
stylesheet: it places surfaces from the variables the core writes,
which StyleX would hash if they went through `defineVars`.

## Layers

The Required CSS sits in `@layer components`. Styles outside a layer
beat styles in one, whatever their specificity, so any class or
selector you write wins over it without `!important`. With Tailwind
v4, `components` is one of its own layers, below `utilities`, so
utility classes win too.

## Closed state

The browser hides closed things with its own low-priority rules:
`[hidden]`, `[popover]:not(:popover-open)`, and
`dialog:not([open])` all compute to `display: none`. Any `display`
you set on the same element wins over them and shows it while
closed. Either scope layout to the open state, or restore the rule:

```css
[role="tabpanel"][hidden],
[id^="mcc:accordion:"][hidden],
[id^="mcc:collapsible:"][hidden] {
  display: none;
}
[id^="mcc:popover:"]:popover-open {
  display: grid;
  gap: 0.5rem;
}
dialog[open] {
  display: flex;
  flex-direction: column;
}
```

Do not hide things with `aria-hidden`, `visibility`, or `opacity`
alone; the core does not read them, and content hidden that way is
still focusable.

## Positioning

Menu, Popover, and Tooltip content opens in the top layer, so it is
never clipped by `overflow` and needs no `z-index`. Two attributes
on the content say where you want it; you write them, and both are
optional.

| Attribute | Values | Default |
| --- | --- | --- |
| `data-mc-side` | `top`, `right`, `bottom`, `left`: the side of the trigger it opens on | `bottom` for a menu and a popover, `top` for a tooltip; a submenu beside its trigger (below) |
| `data-mc-align` | `start`, `center`, `end`: where it lines up along that side | `start` for a menu, `center` for a popover and a tooltip |

On a top or bottom side, `start` and `end` follow the text
direction: `start` lines up the leading edges (left, or right on a
right-to-left page). On a left or right side, `start` lines up the
top edges, or, for a menu, puts its first item level with the
trigger.

```html
<div role="dialog" id="mcc:popover:share" data-mc-side="top" data-mc-align="start" …>
```

The parts' content parts take `side` and `align` props that write
them.

When a surface opens, and again on window resize, the core measures
and writes, on the content element, the variables and the side it
actually opened on. They are read-only: read them in CSS, never set
them.

| Written by the core | Value |
| --- | --- |
| `--mc-trigger-top`, `--mc-trigger-right`, `--mc-trigger-bottom`, `--mc-trigger-left` | The trigger's `getBoundingClientRect()` edges, in viewport pixels |
| `--mc-content-width`, `--mc-content-height` | The content's own size, measured uncapped: a height cap from an earlier open never shrinks it |
| `data-mc-y` | `top` or `bottom`: the side it opened on, above or below. Never with `data-mc-x` |
| `data-mc-x` | `left` or `right`: the side it opened on, beside. Never with `data-mc-y` |
| `--mc-available-height` | With `data-mc-y`: the room between the trigger and the viewport edge on that side. Raw pixels; subtract your offset and margin |

The side is `data-mc-side`, or the default, unless the content does
not fit there and the opposite side has more room: then it flips.
Place from `data-mc-x` and `data-mc-y`, never from `data-mc-side`,
so a flip needs no rule of its own. Viewport pixels match
`position: fixed`. Each component's Required CSS resets the
browser's centered popover placement (`inset: auto; margin: 0`) and
places the surface from the variables, with a 0.5rem margin to the
viewport, for every side and alignment, both text directions, and
the height cap. Copy it rather than writing your own.

**Too tall.** A surface taller than the room above and below opens
on the side with more room, capped to it, and scrolls inside; a
wheel at its end does not scroll the page, which would close it.
One that fits is never capped. A surface beside its trigger
(`data-mc-x`) moves up or down to stay inside the viewport and may
cover its parent menu. None ever moves over its trigger: the press
that opened it would land on an item. Keyboard focus scrolls the
current item just into view, at the nearest edge; give a padded
menu a `scroll-padding-block` equal to its padding
([Corners](#corners)). The pointer never scrolls.

**Submenu direction.** A submenu opens beside its trigger, on the
side its parent menu opened on: the first level at the inline end
(right, or left on a right-to-left page), each deeper level where
the one above it went. The core carries that down: a submenu's
default side is its parent's `data-mc-x`, so a cascade that turned
left at the screen edge keeps going left instead of zigzagging.
Menu's Required CSS places a submenu flush on its menu, its first
item level with its trigger.

Scrolling closes an open surface, so a surface never needs to
follow a moving trigger. A scroll inside a surface leaves it open
(inside a menu, the submenus opened from it close), and a tooltip
shown by focus stays and is repositioned.

The values are measured, not observed, which sets two limits.
Content that grows while open (a list that loads more rows) keeps
the size and side it opened with until the next open or resize.
And CSS `zoom` on an ancestor of a surface places it off its
trigger: the rect is in viewport pixels, and the zoom scales the
surface's position a second time.

## Surfaces start clean

Menus, popovers, dialogs, and tooltips render in the top layer but
inherit from their parent in the DOM, so a menu written inside an
uppercase, centered, `nowrap` nav would carry all of that. Reset the
text properties a surface should not inherit, as the Examples do:
`line-height`, `letter-spacing`, `text-align`, `text-transform`, and
`white-space`. Let `font-size`, `font-family`, `font-weight`, and
`font-style` inherit, so a surface uses the project's typeface at
the size of the text it is written in.

## Dark mode

The page declares `color-scheme`; monochrome never does:

```css
/* follow the OS */
:root {
  color-scheme: light dark;
}

/* or follow a class toggle */
.dark {
  color-scheme: dark;
}
```

Without it, surfaces stay light on a dark page: the browser fills
them with `Canvas`, which follows `color-scheme`. Fill them with the
project's own colors per scheme, the way the rest of the project
does, or keep `Canvas` and `CanvasText` (the Examples do) and they
follow it.

## Corners

When you pad a surface and round its controls, as items in a menu,
keep the corners concentric: the inner radius is the outer radius
minus the padding between them. Set `--_inset` on a menu to its
padding, and the Required CSS places it so its items line up with
the trigger:

```css
[id^="mcc:menu:"] {
  --_inset: 0.25em;
  padding: var(--_inset);
  /* A row scrolled into view keeps the inset it has at rest. */
  scroll-padding-block: var(--_inset);
  border-radius: 0.75em;
}
[id^="mcc:menu:"] [role^="menuitem"] {
  border-radius: calc(0.75em - var(--_inset));
}
```

Draw a surface's edge with a `box-shadow` hairline rather than a
`border`, as the Examples do: a border takes up the padding and
throws the inner corners off.

## Focus

The core never paints focus rings; the browser's `:focus-visible`
does, on every trigger, tab, and item. Keep it, or draw your own
(the Examples use `2px solid currentColor`, which shows on any
background). A CSS reset that removes outlines removes them here
too: restore them on triggers, tabs, bar items, and menu items.

Menu and bar items look best with the ring inside the item
(`outline-offset: -2px`), on top of the `[data-mc-highlighted]`
fill. The highlight follows the pointer and the keyboard, but a
faint one is not enough as the only focus cue (WCAG 1.4.11), so keep
the ring. A mouse open of a menu does not move focus by script, so
it never paints a keyboard ring on the trigger.

Two surfaces take focus themselves and are not controls: a popover's
content (its Required CSS has `:focus { outline: none }`) and a
dialog (give it `outline: none`).

## Variants

A variant is a class (or a data attribute) on the content element,
the surface a trigger opens. With the parts, put the class on the
content part. Pick the side and alignment with `data-mc-side` and
`data-mc-align` (see [Positioning](#positioning)).

```html
<ul id="mcc:menu:row-actions" role="menu" class="menu-compact" popover="manual">
```

Size a component with `font-size`, and size everything in `em`: a
surface inherits from where it sits in the DOM, not from the top
layer it renders in, so it matches its trigger, and a submenu
matches its menu. The Required CSS keeps surfaces `0.5rem` from the
viewport's edge, in `rem`, since that belongs to the screen.

## Transitions

Surfaces enter and leave the top layer, and panels toggle `hidden`,
which are discrete `display` changes. Animate them with
`@starting-style` and `transition-behavior: allow-discrete` (written
as `allow-discrete` in the `transition` shorthand). Browsers without
these features simply skip the animation.

```css
[id^="mcc:popover:"] {
  opacity: 0;
  transition: opacity 120ms ease,
    overlay 120ms allow-discrete, display 120ms allow-discrete;
}
[id^="mcc:popover:"]:popover-open {
  opacity: 1;
}
@starting-style {
  [id^="mcc:popover:"]:popover-open {
    opacity: 0;
  }
}
```

Fade surfaces rather than slide them. A surface flips to the side
with room, so a slide in a fixed direction runs the wrong way
whenever it flips; to slide, key the direction on `data-mc-x` and
`data-mc-y`.

The same shape works for `dialog[open]` and its `::backdrop`, and
for `[role="tooltip"]:popover-open`; a tooltip delay is a
`transition-delay` on its open rule. Leave menus unanimated:
native menus open and close at once, so a fast keyboard or
press-drag user never waits on one. If you animate one anyway, the
submenu safety triangle measures the submenu as the pointer moves,
so entry transforms do not break it.
