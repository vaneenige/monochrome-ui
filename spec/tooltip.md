---
title: Tooltip
description: A short text label shown on hover and focus, never interactive.
---

# Tooltip

A tooltip is a short, non-interactive description of an element,
shown while the element is hovered or focused. It implements the
WAI-ARIA Tooltip pattern: the trigger points at the tooltip with
`aria-describedby`, so screen readers read the text as the
element's description whether or not it is visible. Tooltips show
immediately (there are no timers in the core), stay open while the
pointer moves onto them, and close on Escape without moving focus.

## Anatomy

```html
<button type="button" id="mct:tooltip:save" aria-describedby="mcc:tooltip:save">
  Save
</button>
<div id="mcc:tooltip:save" role="tooltip" popover="manual">
  Saves a copy to your drive
</div>
```

Any focusable element can be the trigger: a button, a link, an
input. Trigger and tooltip can live in different containers.

## Parts

`npx monochrome add tooltip` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- `Tooltip.Content` holds text only.
- For a link or input trigger, write the markup from the Anatomy
  directly; the parts' trigger is always a button.
- The root `div` only scopes the ids: for a tooltip inside a
  sentence, see [Parts](conventions.md#parts).

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Trigger | `mct:tooltip:ID` | a focusable element, `aria-describedby` (exactly the tooltip id) | nothing |
| Tooltip | `mcc:tooltip:ID` | `role="tooltip"`, `popover="manual"` | open state, `--mc-trigger-top` to `--mc-available-height`, `data-mc-x`, `data-mc-y` |

Optional: `data-mc-side` and `data-mc-align` on the tooltip (see
[Styling](#styling)).

## Keyboard

| Key | Action |
| --- | --- |
| Tab onto the trigger | Show the tooltip |
| Tab away | Hide it |
| Escape | Hide it; focus stays. A menu, popover, or dialog behind it sees the next Escape |

## Pointer

- Moving the mouse or pen onto the trigger (or anything inside it)
  shows the tooltip; leaving hides it. Leaving the window straight
  from the trigger does not: the tooltip stays until the pointer
  moves over the page again, a scroll, or Escape.
- Moving onto the tooltip itself keeps it open.
- Hover wins over focus: hovering another trigger shows that
  tooltip, and leaving it brings back the focused trigger's.
- Touch does not show tooltips. Clicking the trigger hides it until
  the trigger is left. Scrolling hides a tooltip shown by hover; one
  shown by focus stays with its trigger.

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[role="tooltip"]:popover-open`: the visible tooltip.
- `data-mc-side` (`top`, `right`, `bottom`, `left`) and
  `data-mc-align` (`start`, `center`, `end`): you write them on the
  content to pick the side of the trigger it opens on and where it
  lines up along it. Default: above, centered. The core writes the
  side it actually opened on (`data-mc-y` or `data-mc-x`, flipped
  when it does not fit) and the variables the Required CSS places
  from ([Positioning](styling.md#positioning)).

### Required

Copy this into the project's global CSS as it is. Without it, the
tooltip opens in the middle of the screen, not at its trigger. It
only places the tooltip, in `@layer components`, so the project's
own styles win ([Layers](styling.md#layers)).

```css
@layer components {
  /* Placed from what the core writes: the trigger rect, the tooltip's
     size, and the side it shows on (data-mc-y, data-mc-x). Every
     placement keeps 0.5rem inside the viewport. */
  [id^="mcc:tooltip:"] {
    --_offset: 0.25em;
    position: fixed;
    inset: auto;
    /* Above, centered on the trigger: side top and align center, the
       defaults. */
    top: calc(var(--mc-trigger-top) - var(--_offset) - var(--mc-content-height));
    left: clamp(0.5rem, (var(--mc-trigger-left) + var(--mc-trigger-right) - var(--mc-content-width)) / 2, 100vw - var(--mc-content-width) - 0.5rem);
    box-sizing: border-box;
    /* Its own width, so a tooltip near an edge does not wrap and feed
       a smaller width back. */
    width: max-content;
    max-width: calc(100vw - 1rem);
    margin: 0;
    /* Popovers default to overflow: auto, which would clip the
       bridge below. */
    overflow: visible;
    /* The pointer can reach it and its bridge, even inside an element
       with pointer-events: none. */
    pointer-events: auto;
  }
  [id^="mcc:tooltip:"][data-mc-y="bottom"] {
    top: calc(var(--mc-trigger-bottom) + var(--_offset));
  }
  /* Beside, it moves up or down to stay inside the viewport. */
  [id^="mcc:tooltip:"][data-mc-x] {
    top: clamp(0.5rem, (var(--mc-trigger-top) + var(--mc-trigger-bottom) - var(--mc-content-height)) / 2, 100dvh - var(--mc-content-height) - 0.5rem);
  }
  [id^="mcc:tooltip:"][data-mc-x="right"] {
    left: min(var(--mc-trigger-right) + var(--_offset), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:tooltip:"][data-mc-x="left"] {
    left: max(0.5rem, var(--mc-trigger-left) - var(--_offset) - var(--mc-content-width));
  }
  /* Along a top or bottom side (data-mc-align): start and end follow
     the text direction, so start is the right edge on a right-to-left
     page. The :dir() rules stand alone: a browser without :dir()
     drops only them. */
  [id^="mcc:tooltip:"][data-mc-y][data-mc-align="start"] {
    left: clamp(0.5rem, var(--mc-trigger-left), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:tooltip:"][data-mc-y][data-mc-align="end"] {
    left: clamp(0.5rem, var(--mc-trigger-right) - var(--mc-content-width), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:tooltip:"][data-mc-y][data-mc-align="start"]:dir(rtl) {
    left: clamp(0.5rem, var(--mc-trigger-right) - var(--mc-content-width), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:tooltip:"][data-mc-y][data-mc-align="end"]:dir(rtl) {
    left: clamp(0.5rem, var(--mc-trigger-left), 100vw - var(--mc-content-width) - 0.5rem);
  }
  /* Along a left or right side: top edges (start) or bottom edges
     (end) lined up; centered by default. */
  [id^="mcc:tooltip:"][data-mc-x][data-mc-align="start"] {
    top: clamp(0.5rem, var(--mc-trigger-top), 100dvh - var(--mc-content-height) - 0.5rem);
  }
  [id^="mcc:tooltip:"][data-mc-x][data-mc-align="end"] {
    top: clamp(0.5rem, var(--mc-trigger-bottom) - var(--mc-content-height), 100dvh - var(--mc-content-height) - 0.5rem);
  }
  /* A bridge over the gap to the trigger, on the side facing it, so
     the pointer can move onto the tooltip without leaving both (WCAG
     1.4.13). */
  [id^="mcc:tooltip:"]::after {
    content: "";
    position: absolute;
    inset: 100% 0 auto;
    height: calc(var(--_offset) + 1px);
  }
  [id^="mcc:tooltip:"][data-mc-y="bottom"]::after {
    inset: auto 0 100%;
  }
  [id^="mcc:tooltip:"][data-mc-x]::after {
    width: calc(var(--_offset) + 1px);
    height: auto;
  }
  [id^="mcc:tooltip:"][data-mc-x="left"]::after {
    inset: 0 auto 0 100%;
  }
  [id^="mcc:tooltip:"][data-mc-x="right"]::after {
    inset: 0 100% 0 auto;
  }
}
```

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
/* Inverted, so it reads over anything. */
[id^="mcc:tooltip:"] {
  padding: 0.25em 0.5em;
  border: 0;
  background: CanvasText;
  color: Canvas;
  font-size: 0.8125em;
  line-height: 1.5;
  letter-spacing: normal;
  text-align: start;
  text-transform: none;
  white-space: normal;
}
/* A disabled trigger stays focusable, so show it. */
button[id^="mct:tooltip:"][aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
button[id^="mct:tooltip:"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Accessibility

- Keep the text short and plain. A tooltip cannot hold links,
  buttons, or anything focusable; use a [Popover](popover.md) for
  that.
- The text is the trigger's description, not its name. An icon-only
  button still needs `aria-label` for its name.
- It meets WCAG 1.4.13: hoverable (the pointer can move onto it;
  the Required CSS bridges the gap to the trigger with `::after`),
  dismissible (Escape, without moving focus), and persistent (it
  stays until hover or focus leaves).
- An `aria-disabled` trigger still shows its tooltip, which is a
  good place to say why it is disabled.

## Design choices

- **No delay in the core.** A tooltip shows on the event that
  hovers or focuses its trigger (there are no timers). For a delay,
  add `transition-delay` in CSS.
- **Never on touch.** A tap is a press: the trigger's own action
  runs, and a tooltip would cover it. Screen readers still read the
  text as the trigger's description.
- **Escape is the tooltip's first.** While a tooltip is shown, the
  core takes Escape in the capture phase and stops it, so no other
  handler on the page sees that keypress. The next Escape reaches a
  menu, popover, or dialog behind it.
- **A click hides it until the trigger is left**, so a button that
  opens something is never covered by its own tooltip.

## Common mistakes

- Putting two ids in the trigger's `aria-describedby`. The core
  resolves the attribute as one id. Fix: exactly the tooltip id;
  put other description text inside the tooltip.
- Using `aria-labelledby` or `aria-controls` for the link. Fix:
  `aria-describedby` on the trigger.
- Forgetting `role="tooltip"` or `popover="manual"` on the content.
  Fix: add both.
- A non-focusable trigger (a bare `<span>` or `<svg>`). Keyboard
  users never see it. Fix: use a button or link, or add
  `tabindex="0"`.
- Interactive content inside the tooltip. Fix: use a
  [Popover](popover.md).
