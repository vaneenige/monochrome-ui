# Tooltip

How `src/tooltip.ts` works. Positioning, resize, and scroll are
shared with the other surfaces; see `docs/dom.md`.

**Two sources, one sync.** `tooltipHovered` and `tooltipFocused`
each track the trigger that currently owns that input, and
`tooltipSync` derives the shown tooltip from them: hover wins
over focus, and when hover leaves the focused trigger's tooltip
comes back. Every listener only updates its own source and calls
`tooltipSync`; nothing else calls `showPopover` or `hidePopover`.

**Triggers are any element.** Both the hover and the focus path
resolve the trigger with `findAncestor`, so a link or an input
carrying the `mct:tooltip:` id shows its tooltip on focus as well
as on hover. `focusout` only checks `relatedTarget`: while
`tooltipFocused` is set, focus is on or inside that trigger, so a
blur to nowhere always means leaving it. `pointermove` ignores
touch pointers and returns early while the target is unchanged,
and a move onto the tooltip content itself keeps it shown (WCAG
1.4.13 Hoverable).

**Click suppresses until the trigger is left.** A click on a
trigger records it as `tooltipSuppressed` and hides its tooltip;
it stays hidden while that trigger is still hovered or focused
and clears once both have moved elsewhere. Clicking a trigger
that is also a Popover or Menu trigger therefore does not show a
tooltip over the surface it just opened.

**Escape in capture.** When a tooltip is shown, its `keydown`
listener runs in capture and `stopImmediatePropagation`s on
Escape. The first Escape dismisses the tooltip; a Menu or Popover
still open sees the second Escape. No import-order coordinator,
and Tooltip does not name those components. Focus does not move
(WCAG 1.4.13 Dismissable).
