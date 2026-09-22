# Dialog

How `src/dialog.ts` works.

**Escape is native without a transition.** `showModal()` already
closes on Escape and restores focus to the trigger, so with no
view-transition host (see `docs/dom.md`) every close request
and form `method="dialog"` is left to the browser. A native
close leaves the file-scope `dialogContent` / `dialogTrigger`
stale; `dialogOpen` guards on `dialogContent.open` rather than
on the ref being set, so a natively closed dialog reopens
cleanly.

**Close requests go through `dialogClose` when the dialog
transitions.** Escape, a backdrop click with `closedby="any"`,
`requestClose()`, and the Android back gesture all fire
`cancel` on the dialog before the browser closes it. `cancel`
does not bubble, so a capture listener on `window` sees it
first, before any listener on the dialog. When the open dialog
has a host and the event is `cancelable`, that listener adds
`dialogCancel` to the dialog once. It runs after the author's
own `cancel` listeners, and only when none of them called
`preventDefault()` does it cancel the native close and call
`dialogClose`. A cancel that is not cancelable (the browser
grants one per user activation) closes natively. `cancel` does
not carry the value passed to `requestClose(value)`, so a
transitioning dialog keeps its previous `returnValue` there.

**Forms with `method="dialog"`.** A `submit` from a form whose
nearest `mcc:dialog:` is the open, transitioning dialog is
cancelled once no author listener cancelled it, and
`dialogClose` closes the dialog instead. The submitter's
`formmethod` wins over the form's `method`, as it does
natively, and its `value` attribute becomes `returnValue`. An
image submitter is left to the browser, which sets
`returnValue` to the click coordinates. Validation has already
passed by the time `submit` fires.
Calling `close()` from author code never animates.

**Close button focus.** `dialogClose` calls `close()`, which
restores the element focused when the dialog opened. It focuses
the trigger only when that restore landed elsewhere, so a pointer
close does not replace a mouse focus with a script focus. A
script focus there would match `:focus-visible` in Chromium.

**Open and close dispatch on `click`.** Both triggers are plain
`findAncestor` prefix matches from the event target, close
checked first. Menu calls `click()` on the item after keyboard
activation of a non-href item, so a menuitem carrying the
`mct:dialog-open:` id opens the dialog from the keyboard without
Menu knowing what a dialog is.
