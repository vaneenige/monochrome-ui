# Dialog

How `src/dialog.ts` works.

**Escape is native.** `showModal()` already closes on Escape and
restores focus to the trigger. The Close button is the only path
that needs `dialogClose`. Native close (Escape, form
`method="dialog"`) leaves the file-scope `dialogContent` /
`dialogTrigger` stale; `dialogOpen` guards on `dialogContent.open`
rather than on the ref being set, so a natively closed dialog
reopens cleanly.

**Open and close dispatch on `click`.** Both triggers are plain
`findAncestor` prefix matches from the event target, close
checked first. Menu calls `click()` on the item after keyboard
activation of a non-href item, so a menuitem carrying the
`mct:dialog-open:` id opens the dialog from the keyboard without
Menu knowing what a dialog is.
