---
title: Dialog
description: A modal window on the native dialog element, opened by a button.
---

# Dialog

A dialog is a modal window that holds a task or a decision. It is a
native `<dialog>` opened with `showModal()`, so the browser handles
the focus trap, the inert background, the top layer, Escape, and
`::backdrop`. monochrome wires the open and close buttons and
returns focus to the trigger. It implements the WAI-ARIA Dialog
(Modal) pattern; add `role="alertdialog"` for an alert dialog.

## Anatomy

```html
<button type="button" id="mct:dialog-open:confirm" aria-haspopup="dialog" aria-controls="mcc:dialog:confirm">
  Delete file
</button>
<dialog id="mcc:dialog:confirm" aria-labelledby="mcc:dialog-title:confirm" aria-describedby="mcc:dialog-description:confirm" data-mc-autofocus="mct:dialog-close:confirm" tabindex="-1">
  <h2 id="mcc:dialog-title:confirm">Delete this file?</h2>
  <p id="mcc:dialog-description:confirm">This cannot be undone.</p>
  <button type="button" id="mct:dialog-close:confirm">Cancel</button>
  <button type="button">Delete</button>
</dialog>
```

The close button needs no link: a click on any `mct:dialog-close:`
element closes the dialog monochrome opened. `data-mc-autofocus`
on the dialog names Cancel by its id, so focus lands there when the
dialog opens: the decision is destructive (see
[Accessibility](#accessibility)). A form with
`method="dialog"` inside the dialog also closes it natively.

## Parts

`npx monochrome add dialog` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- `Dialog.Content` points `aria-labelledby` at `Dialog.Title` and
  `aria-describedby` at `Dialog.Description`. Render both, or pass
  `aria-label` / `aria-description` instead. A dialog with no
  description unsets `aria-describedby` (`aria-describedby={undefined}`
  in React, `:aria-describedby="undefined"` in Vue): the link then
  goes, instead of pointing at an id that does not exist (screen
  readers ignore that, but validators flag it).
- `initialFocus` writes `data-mc-autofocus`: `"close"` names the
  dialog's own `Dialog.Close`, any other value is the id of the
  element to focus.
- `role="alertdialog"` on `Dialog.Content` makes it an alert.
- `Dialog.Action` never closes the dialog: its click handler does
  the work, and a `Dialog.Close` (or a `method="dialog"` form)
  closes it. In a form, give it `type="submit"`.
- `Dialog.Title` renders an `h2`; `as` picks another level.

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Open trigger | `mct:dialog-open:ID` | `<button type="button">`, `aria-haspopup="dialog"`, `aria-controls` | nothing (focus returns to it) |
| Dialog | `mcc:dialog:ID` | a `<dialog>` element, `aria-labelledby` or `aria-label`, `tabindex="-1"` | open state via `showModal()` and `close()` |
| Title | `mcc:dialog-title:ID` | a heading | nothing |
| Description | `mcc:dialog-description:ID` | optional | nothing |
| Close button | `mct:dialog-close:ID` | `<button type="button">` inside the dialog | nothing |

Optional: `aria-disabled="true"` on the open trigger,
`closedby="any"` on the dialog for light dismiss,
`data-mc-autofocus` on the dialog, set to the id of the element
inside to focus on open instead of the dialog.

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space on the trigger | Open the dialog (native button click) |
| Tab, Shift+Tab | Cycle through the dialog's focusable elements (native) |
| Escape | Close the dialog and return focus to the trigger (native) |
| Enter, Space on a close button | Close the dialog and return focus to the trigger |

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `dialog[open]`: the open dialog; `dialog:not([open])` is hidden
  by the browser.
- `::backdrop`: the layer behind a modal dialog.
- `[id^="mct:dialog-open:"][aria-disabled="true"]`: disabled
  trigger.

The browser places, fills, and hides a `dialog`, and draws its
`::backdrop`, so it needs no CSS to work. The core focuses the
dialog itself on open (unless `data-mc-autofocus` names a target),
so give it `outline: none`: it is not a control.

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
[id^="mcc:dialog:"] {
  box-sizing: border-box;
  max-width: calc(100vw - 2rem);
  /* It takes focus on open; it is not a control. */
  outline: none;
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
[id^="mcc:dialog:"]::backdrop {
  background: rgb(0 0 0 / 0.4);
}
/* A disabled trigger stays focusable, so show it. */
[id^="mct:dialog-open:"][aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
[id^="mct:dialog-open:"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Accessibility

- Every dialog needs a name: `aria-labelledby` pointing at its
  title, or `aria-label`.
- Focus moves to the dialog itself on open, so its name is
  announced and the next Tab reaches the first control. An
  element named by the dialog's `data-mc-autofocus` takes focus
  instead. Focus
  returns to the trigger on close, including Escape and
  `closedby="any"`.
- Pick the target by what the dialog holds:

  | The dialog holds | Focus on open |
  | --- | --- |
  | A form | `data-mc-autofocus` names the first field |
  | A destructive or irreversible decision | `data-mc-autofocus` names the least destructive button (Cancel) |
  | Content to read, or anything else | nothing: the dialog itself |
- The page behind a modal dialog is inert; there is nothing to
  hide with `aria-hidden`.

## Design choices

- **Modal only.** A dialog always opens with `showModal()`. A
  panel that leaves the page usable is a [Popover](popover.md).
- **A backdrop click does not close it.** A dialog holds a task or
  a decision, and a stray click should not throw it away. Opt in
  per dialog with `closedby="any"`; browsers without it keep Escape
  and the close button.
- **One dialog at a time.** A `mct:dialog-open:` trigger inside an
  open dialog does nothing; there is no stack to unwind. Put the
  next step inside the same dialog.
- **Any close button closes the open dialog.** The core does not
  match the close button's id to the dialog's, so one
  `mct:dialog-close:` id per dialog is enough.
- **Focus lands on the dialog unless it names a target.** The
  browser would focus the first focusable element, usually a close
  button: a screen reader opens on "Close, button" and a stray
  Enter dismisses the dialog. The core focuses the dialog instead,
  and `data-mc-autofocus` is the one explicit way to pick a control.
  It is an id link on the dialog, like `aria-labelledby`, rather
  than `autofocus` on the target: React drops `autofocus` from
  markup it renders on the client, and the core resolves an id
  without searching the dialog.

## Common mistakes

- Using a `<div role="dialog">` as the content. The core only opens
  a `<dialog>` element. Fix: use `<dialog>`; for a non-modal panel
  anchored to a button, use [Popover](popover.md).
- Adding the `open` attribute in markup. That opens it non-modally
  and `showModal()` then fails. Fix: leave `open` off; the trigger
  opens it.
- Calling `dialog.showModal()` or `close()` from your own click
  handler. Fix: give the buttons the `mct:dialog-open:` and
  `mct:dialog-close:` ids and delete the handler.
- Rendering the `<dialog>` inside menu content, or inside popover
  content on a page that can scroll. The dialog vanishes when that
  surface closes (a menu as the item activates, a popover on a
  scroll) but stays open and modal, so the page is left inert.
  Fix: render it outside a menu. From a popover, render it inside
  the content so Escape closes the dialog first and focus returns
  to its trigger, and lock the page scroll while it is open
  (`html:has(dialog:modal) { overflow: hidden }`); see
  [Popover](popover.md).
- Opening a second dialog from inside an open one. monochrome
  tracks one open dialog at a time and ignores the second trigger.
  Fix: close the first (a `mct:dialog-close:` button) before opening
  another, or put the second step inside the same dialog.
- Styling the dialog with `display: flex` or `grid`. That overrides
  the browser's closed-state rule and shows it on the page. Fix:
  scope layout to `dialog[open]`.
- Leaving focus on the dialog when it holds a form, or naming the
  destructive button of a confirmation. Fix: pick the target from
  the table under [Accessibility](#accessibility).
- `data-mc-autofocus` on the element to focus. The core reads it
  only on the dialog, as an id. Fix: give the element an id and put
  that id in the dialog's `data-mc-autofocus`.
- React `autoFocus` on an element in the dialog. React writes no
  attribute when it renders on the client, so a dialog that mounts
  after load opens on itself. Fix: `initialFocus` on
  `Dialog.Content`.
- Putting `aria-expanded` on the open trigger. Dialog triggers use
  `aria-haspopup="dialog"`; the core does not write `aria-expanded`.
