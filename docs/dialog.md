# Dialog

How `src/dialog.ts` works.

**Escape is native.** `showModal()` already closes on Escape and
restores focus to the trigger. The Close button is the only path
that needs `dialogClose`. Native close (Escape, form
`method="dialog"`) leaves the file-scope `dialogContent` /
`dialogTrigger` stale; `dialogOpen` guards on `dialogContent.open`
rather than on the ref being set, so a natively closed dialog
reopens cleanly. It also requires `isConnected`: removing an
open dialog (a router swap, a framework unmount) drops it from
the top layer but leaves its `open` attribute, and without that
check the stale ref would refuse every later open.

**Light dismiss is native too.** A backdrop click does not close
the dialog, the same default as `showModal()`: a modal holds a
task or a decision, and a stray click should not throw it away. A
dialog that should close on an outside click opts in with the
standard `closedby="any"` attribute, and the browser does the
rest: it closes on a press and release both outside the dialog,
and restores focus as it does for Escape. That close is native, so
it takes the same path as Escape above. Browsers without
`closedby` ignore the attribute and keep Escape and the Close
button, which is why the core ships no fallback. A menu or popover
open inside the dialog does not hold the dialog back: one outside
click closes the surface (its own outside `pointerdown`) and the
dialog together.

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
