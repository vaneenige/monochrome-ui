---
title: Popover
description: A non-modal panel anchored to a button, for any interactive content.
---

# Popover

A popover is a non-modal panel that a button opens in the top layer:
a filter form, a share sheet, a color picker, a small card of
details. Focus moves into it on open and back to the button on
close. It closes on Escape, on a press outside, when focus leaves
it, and on scroll. It follows the WAI-ARIA Disclosure pattern with a
non-modal dialog as the content. Only one popover is open at a time.

## Anatomy

```html
<button type="button" id="mct:popover:share" aria-controls="mcc:popover:share" aria-expanded="false">
  Share
</button>
<div role="dialog" id="mcc:popover:share" aria-labelledby="mct:popover:share" aria-describedby="mcc:popover-description:share" popover="manual" tabindex="-1">
  <p id="mcc:popover-description:share">Anyone with the link can view this file.</p>
  <input type="text" value="https://example.com/f/42" aria-label="Link" readonly>
  <button type="button">Copy link</button>
</div>
```

The content is a non-modal dialog (`role="dialog"`), named after its
trigger through `aria-labelledby`; use `aria-label` instead when the
trigger text is not a good name. It takes focus when it opens, and
the role tells screen readers what they landed in.

## Parts

`npx monochrome add popover` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- `Popover.Content` points `aria-describedby` at
  `Popover.Description`. Render one, pass `aria-description`, or,
  with no description, unset `aria-describedby` so the link does
  not point at a missing id.
- `Popover.Content` renders `role="dialog"`; pass `role` to replace
  it when the content is something else, such as a `listbox`.
- `Popover.Title` is a visual heading; the content's accessible
  name stays the trigger unless you pass `aria-label`.
- The popover parts load `monochrome/menu` before
  `monochrome/popover`, so a menu inside the content closes first
  on Escape; delete that import if you never nest one.

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Trigger | `mct:popover:ID` | `<button type="button">`, `aria-expanded="false"`, `aria-controls` | `aria-expanded` |
| Content | `mcc:popover:ID` | `role="dialog"`, `popover="manual"`, `tabindex="-1"`, `aria-labelledby` (the trigger) or `aria-label` | open state, `--mc-trigger-top` to `--mc-available-height`, `data-mc-x`, `data-mc-y` |
| Title | `mcc:popover-title:ID` | optional heading | nothing |
| Description | `mcc:popover-description:ID` | optional, referenced by `aria-describedby` | nothing |

Optional: `aria-disabled="true"` on the trigger, `data-mc-side` and
`data-mc-align` on the content (see [Styling](#styling)).

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space on the trigger | Toggle; opening focuses the content, closing focuses the trigger |
| Tab, Shift+Tab | Move through the content; leaving it closes the popover, except onto the trigger |
| Escape | Close and focus the trigger |

Escape yields to anything nested: with a [Menu](menu.md), a
[Tooltip](tooltip.md), or a [Dialog](dialog.md) open inside the
popover, the first Escape closes that, the next one closes the
popover. A menu list or dialog counts as inside only when it is
rendered inside the content.

## Dismissal

- A primary press outside both the trigger and the content closes
  it (focus is not moved).
- Focus moving to an element outside the content closes it, except
  onto the trigger.
- A scroll anywhere outside the content closes it; scrolling inside
  the content does not. Resizing the window repositions it.
- Opening another popover, or opening a menu outside this popover,
  closes it. A menu trigger inside the content keeps it open.

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[id^="mcc:popover:"]:popover-open`: the open content.
- `[id^="mct:popover:"][aria-expanded="true"]`: the open trigger.
- `[id^="mct:popover:"][aria-disabled="true"]`: a disabled trigger.
- `data-mc-side` (`top`, `right`, `bottom`, `left`) and
  `data-mc-align` (`start`, `center`, `end`): you write them on the
  content to pick the side of the trigger it opens on and where it
  lines up along it. Default: below, centered. The core writes the
  side it actually opened on (`data-mc-y` or `data-mc-x`, flipped
  when it does not fit) and the variables the Required CSS places
  from ([Positioning](styling.md#positioning)).

### Required

Copy this into the project's global CSS as it is. Without it, the
content opens in the middle of the screen, not at its trigger. It
only places the content, in `@layer components`, so the project's
own styles win ([Layers](styling.md#layers)).

```css
@layer components {
  /* Placed from what the core writes: the trigger rect, the content's
     size, and the side it opened on (data-mc-y, data-mc-x). Every
     placement keeps 0.5rem inside the viewport. */
  [id^="mcc:popover:"] {
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
    /* Below, centered on the trigger: side bottom and align center,
       the defaults. */
    top: calc(var(--mc-trigger-bottom) + var(--_offset));
    left: clamp(0.5rem, (var(--mc-trigger-left) + var(--mc-trigger-right) - var(--mc-content-width)) / 2, 100vw - var(--mc-content-width) - 0.5rem);
    box-sizing: border-box;
    /* Its own width, so content near an edge does not wrap and feed a
       smaller width back. */
    width: max-content;
    max-width: calc(100vw - 1rem);
    max-height: var(--_max);
    overflow-y: auto;
    /* A wheel past its end would scroll the page, which closes it. */
    overscroll-behavior: contain;
    margin: 0;
  }
  /* The core moves focus to the content on open; it is not a
     control, so it draws no ring. */
  [id^="mcc:popover:"]:focus {
    outline: none;
  }
  /* Above, its bottom edge on the trigger's, however tall it is. */
  [id^="mcc:popover:"][data-mc-y="top"] {
    top: calc(var(--mc-trigger-top) - var(--_offset) - min(var(--mc-content-height), var(--_max)));
  }
  /* Beside, it moves up or down to stay inside the viewport. */
  [id^="mcc:popover:"][data-mc-x] {
    --_max: calc(100dvh - 1rem);
    top: clamp(0.5rem, (var(--mc-trigger-top) + var(--mc-trigger-bottom) - var(--mc-content-height)) / 2, 100dvh - var(--mc-content-height) - 0.5rem);
  }
  [id^="mcc:popover:"][data-mc-x="right"] {
    left: min(var(--mc-trigger-right) + var(--_offset), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:popover:"][data-mc-x="left"] {
    left: max(0.5rem, var(--mc-trigger-left) - var(--_offset) - var(--mc-content-width));
  }
  /* Along a top or bottom side (data-mc-align): start and end follow
     the text direction, so start is the right edge on a right-to-left
     page. The :dir() rules stand alone: a browser without :dir()
     drops only them. */
  [id^="mcc:popover:"][data-mc-y][data-mc-align="start"] {
    left: clamp(0.5rem, var(--mc-trigger-left), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:popover:"][data-mc-y][data-mc-align="end"] {
    left: clamp(0.5rem, var(--mc-trigger-right) - var(--mc-content-width), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:popover:"][data-mc-y][data-mc-align="start"]:dir(rtl) {
    left: clamp(0.5rem, var(--mc-trigger-right) - var(--mc-content-width), 100vw - var(--mc-content-width) - 0.5rem);
  }
  [id^="mcc:popover:"][data-mc-y][data-mc-align="end"]:dir(rtl) {
    left: clamp(0.5rem, var(--mc-trigger-left), 100vw - var(--mc-content-width) - 0.5rem);
  }
  /* Along a left or right side: top edges (start) or bottom edges
     (end) lined up; centered by default. */
  [id^="mcc:popover:"][data-mc-x][data-mc-align="start"] {
    top: clamp(0.5rem, var(--mc-trigger-top), 100dvh - var(--mc-content-height) - 0.5rem);
  }
  [id^="mcc:popover:"][data-mc-x][data-mc-align="end"] {
    top: clamp(0.5rem, var(--mc-trigger-bottom) - var(--mc-content-height), 100dvh - var(--mc-content-height) - 0.5rem);
  }
}
```

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
[id^="mcc:popover:"] {
  padding: 1em;
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
/* A disabled trigger stays focusable, so show it. */
[id^="mct:popover:"][aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
[id^="mct:popover:"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Accessibility

- The trigger announces `aria-expanded`, and the content is a
  `role="dialog"` named by the trigger or `aria-label`, so a reader
  knows where focus went. Without a role the name is dropped:
  ARIA does not name a plain `div`.
- `tabindex="-1"` on the content lets the core move focus into it
  on open; the reader then tabs through its controls.

## Design choices

- **Non-modal, and it gets out of the way.** It never traps focus
  and closes as soon as the reader moves on ([Dismissal](#dismissal));
  a task that must be finished first is a [Dialog](dialog.md).
- **Focus goes to the content itself** on open, not its first
  field, so a screen reader announces the dialog's name before
  its controls. Tab reaches the first control.
- **One popover at a time.** Opening one closes the other; a
  popover inside a popover is not supported. Nest a
  [Menu](menu.md) or a [Dialog](dialog.md) instead.
- **Scroll closes, resize repositions.** A scroll outside the
  content can carry the trigger away, so the popover closes rather
  than float detached from it. A resize, such as a phone keyboard
  opening under a focused field, only repositions it.
- **Role `dialog` by default.** Replace it with `role` when the
  content is really something else, such as a `listbox`.

## Common mistakes

- Using the HTML `popovertarget` attribute, or `popover="auto"`, on
  top of monochrome. The browser would toggle and dismiss it without
  updating `aria-expanded`. Fix: `popover="manual"`, no
  `popovertarget`.
- Leaving out `tabindex="-1"` on the content. Opening then cannot
  move focus in, and the first Tab goes elsewhere. Fix: add it.
- Adding `hidden` to the content. The popover attribute already
  hides it, and `hidden` keeps it hidden when open. Fix: remove
  `hidden`.
- Using a popover for a list of actions. Fix: that is a
  [Menu](menu.md), with roving focus and typeahead.
- Rendering a menu list, or a dialog the content opens, outside
  the content. Focus moving into it closes the popover: the menu
  is left open with its trigger hidden, and the dialog cannot
  return focus when it closes. Fix: render both inside the
  content (a `Menu.Popover` or `Dialog.Content` written inside
  `Popover.Content` is). On a page that scrolls, also lock the
  scroll while a dialog is open
  (`html:has(dialog:modal) { overflow: hidden }`): a scroll closes
  the popover, and the dialog inside vanishes with it.
- Importing `monochrome/popover` before `monochrome/menu` in a
  per-component setup. Escape on a pointer-opened menu inside the
  popover would then close the popover. Fix: import menu first (the
  bare `monochrome` import and the popover component file already do).
- Setting `display: flex` on the content without `:popover-open`.
  It overrides the closed state. Fix: set `display` only on
  `:popover-open`.
