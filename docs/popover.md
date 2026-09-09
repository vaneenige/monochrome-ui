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
focusable child or Shift+Tab off the trigger dismisses. A blur
with no `relatedTarget` is ignored: nothing outside the popover
received focus, so there is nothing to yield to.

**Escape yields to nested surfaces.** Popover skips an Escape
that is already `defaultPrevented` (a Menu inside the popover
consumed it first) and one whose target sits in a nested surface:
the walk from the event target up to the popover content stops at
any element whose `popover` IDL property is set. The second check
reads the DOM, so a keyboard session inside a nested menu is safe
in any registration order. A pointer-opened menu leaves focus on
its trigger, outside the nested surface, so that case rests on
the first check and on Menu's `keydown` running before Popover's:
`src/index.ts` and the wrapper indexes import `menu` before
`popover` (alphabetical order guarantees it), and per-component
imports must keep that order. Otherwise Escape closes the popover
and focuses its trigger.

**One popover at a time.** Opening a popover closes the one in
`popoverShown` first. Menu and Popover close each other when the
press is outside both surfaces (see "Outside `pointerdown`
dismisses"), not through any shared state.
