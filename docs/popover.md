# Popover

How `src/popover.ts` works. Positioning, resize, and scroll are
shared with the other surfaces; see `docs/dom.md`.

**Outside `pointerdown` dismisses.** Popover closes on a primary
`pointerdown` that lands outside both its trigger and its
content. Menu opens on `pointerdown` too, so a menu opening
outside the popover closes it in the same event without either
file naming the other. A menu trigger inside the popover content
is not outside, so that press leaves the popover open. The
`click` listener only toggles a trigger: opening moves focus
into the content, closing returns it to the trigger.

**`focusout` closes when focus leaves.** A blur whose
`relatedTarget` is an element, is not the trigger, and is not
inside the content, closes the popover, so Tab past the last
focusable child or Shift+Tab off the trigger dismisses. Safari
does not focus a clicked button: a click on the trigger moves
focus from the content to the trigger's nearest focusable
ancestor instead. So an ancestor of the trigger with a negative
`tabIndex` (what Safari focuses; Tab never lands there) does
not close it, and the `click` that follows toggles it closed. A
blur with no `relatedTarget` is ignored: nothing outside the
popover received focus, so there is nothing to yield to.

**Nested surfaces live inside the content.** Both dismissals
above test containment in the content element, not the top
layer, so a surface opened from the popover counts as inside only
when it is a DOM descendant of the content. A menu list rendered
elsewhere closes the popover on the first hover that focuses one
of its items (the React `Menu.Popover` renders where it is
written, so one written in `Popover.Content` is inside). A
`<dialog>` rendered elsewhere takes focus out as it opens, which
closes the popover and hides the dialog's trigger, so its close
has nowhere to return focus. A dialog inside the content has the
opposite exposure: a page scroll behind it closes the popover,
and the dialog stays open and modal but invisible with it.

**Escape yields to nested surfaces.** Popover skips an Escape
that is already `defaultPrevented` (a Menu inside the popover
consumed it first) and one whose target sits in a nested surface:
the walk from the event target up to the popover content stops at
any element whose `popover` IDL property is set, or at a
`<dialog>`. A modal dialog opened from inside the content is such
a surface, and Escape is its native close; taking that Escape
would hide the popover around a dialog that stays open. The walk
reads the DOM, so a keyboard session inside a nested menu is safe
in any registration order. Otherwise Escape closes the popover
and focuses its trigger.

**Menu's `keydown` runs first.** A pointer-opened menu leaves
focus on its trigger, outside the nested surface, so Escape there
rests on the `defaultPrevented` check and on Menu's `keydown`
running before Popover's. `src/index.ts` imports `menu` before
`popover` (alphabetical order guarantees it), the popover part
(`templates/react/popover.tsx`) imports `monochrome/menu` first,
and per-component imports must keep that order.

**One popover at a time.** Opening a popover closes the one in
`popoverShown` first. Closing clears `popoverShown` even when the
content is gone (removed while open, or swapped by the router),
and Escape acts only while the content exists, so a removed
popover never swallows a later Escape meant for a dialog. Menu
and Popover close each other when the press is outside both
surfaces (see "Outside `pointerdown` dismisses"), not through any
shared state.
