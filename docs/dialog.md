# Dialog

How `src/dialog.ts` works.

**Escape is native.** `showModal()` already closes on Escape and
restores focus to the element focused when it opened.
`dialogOpen` focuses the trigger first when it is not already
focused (Safari does not focus a clicked button, which would
leave `body` as the element to restore), so every native close
returns focus to the trigger. The Close button is the only path
that needs `dialogClose`. No close path clears the file-scope
`dialogContent` / `dialogTrigger`; `dialogOpen` and `dialogClose`
guard on `dialogContent.open` rather than on the ref being set,
so a closed dialog reopens cleanly. `dialogOpen` also requires
`isConnected`: removing an open dialog (a router swap, a
framework unmount) drops it from the top layer but leaves its
`open` attribute, and without that check the stale ref would
refuse every later open.

**Focus on open.** `showModal()` focuses the element with
`autofocus`, or else the first focusable element, which is
usually a close button. `dialogOpen` then focuses the element the
dialog's `data-mc-autofocus` names by id, or else the dialog
itself (it carries `tabindex="-1"`). The default target is the
dialog, so screen readers announce its name and the next Tab
reaches the first control; the author opts into a control by
naming it. The mark is an id link on the dialog, not an attribute
on the target, so the core resolves it with one `getLinked` and
never searches the subtree (no `querySelector`). It is not native
`autofocus` because React writes no `autofocus` attribute when it
renders on the client (it calls `focus()` on mount instead, which
does nothing in a closed dialog). The link is read on every open,
so markup added after load works. One exception keeps native
markup working: when `showModal()` already focused an `autofocus`
element, `dialogOpen` leaves it there. A target that cannot take
focus (missing, or in a hidden tab panel) ignores the call and
keeps the native target, as does a dialog without `tabindex`.

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
