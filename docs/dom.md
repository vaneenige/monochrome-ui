# Shared helpers and the disclosure components

How `src/dom.ts` works, and the mechanisms Accordion, Tabs, and
Collapsible build on it. The core carries no comments; these
paragraphs are its comments. Rules for editing this file live in
`AGENTS.md` under "Where things go".

**`while` with sibling pointers, not `querySelectorAll`.** Every
DOM walk in the core is a hand-rolled loop: `let item =
root.firstElementChild; while (item) { ...; item =
item.nextElementSibling }`. `querySelectorAll` would allocate a
NodeList and run a selector parser for structure we already know
(Accordion items are direct children of the root; each trigger
sits inside an h2-h6 Header, so the walk follows that item's
first-child chain to `mct:accordion:`; Tab buttons are direct
children of the List). A sibling-pointer walk costs nothing,
makes iteration order explicit, and lets a single traversal do
work that a list plus follow-up would split in two.

**`findAncestor` over `closest()`.** `findAncestor(el, prefix)`
walks `parentElement` up checking `id.startsWith(prefix)`.
`closest(".foo")` would require classes or data attributes, which
is the exact shadow registry the ID-prefix scheme exists to avoid.
The manual walk is fewer bytes, inlines into a single loop, and
doesn't pull in the CSS selector engine. Prefix families do not
overlap (`mct:` vs `mcc:`), so a trigger is never a content hit:
start at the element itself. Do not pass `parentElement` to skip
it.

**Prefix dispatch from the event target.** Collapsible, Accordion,
and Tabs resolve the trigger with one `findAncestor` from the
event target: the nearest matching prefix is the whole decision.
Accordion's `mcr:accordion:` root is a later walk, not click
dispatch. Dialog is two prefixes, close then open (see
`docs/dialog.md`). Popover click only toggles a trigger; Tooltip
click only suppresses (see `docs/popover.md`, `docs/tooltip.md`).
An event that started inside another component's markup matches
nothing for that prefix, which is how a `click` that began on
`mct:menu:` never toggles a disclosure. Menu keeps hand-rolled
walks where one pass mixes prefixes with roles; see
`docs/menu.md`.

**Roving-boundary sentinel.** `rovingBoundary` remembers the first
candidate the walker rejected; if we ever see it again we give
up and set `shouldPreventDefault` so the key does not scroll. A
generic sibling walker can't distinguish "walked past the end
and wrapped" from "kept going past the start", and on an
all-disabled list the naive walker loops forever. One pointer,
zero counters, zero extra passes. The boundary is cleared at the
top of every listener that drives a walk: `keydown` in Accordion,
Tabs, and Menu, and Menu's `pointerup` (the radio sweep).
Accordion and Tabs bail out of `keydown` on an Alt / Ctrl /
Meta modifier so browser shortcuts such as back and forward
pass through untouched.

**RTL by mirroring the key, once.** Menu and Tabs pass `event.key`
through `spatialKey`, which swaps ArrowLeft and ArrowRight when
`document.dir` is `"rtl"`, and dispatch on the result. Horizontal
arrows are spatial: with `dir="rtl"` the item visually to the
right is the previous DOM sibling, and every ArrowLeft /
ArrowRight meaning flips. The switches keep reading as the LTR
spec. Logical keys (Home, End, Tab, typeahead) follow DOM order.
Direction is read from `document.dir` on every keydown (DOM as
state, never cached); consumers declare `dir` on `<html>`. The
pointer layer needs no branch: the safety triangle's near-edge
clamp and signed-movement test are side-agnostic, and which side
anything opens on is consumer CSS.

**Popover API with CSS-variable positioning.** `position` publishes
the trigger rect (`--top`, `--right`, `--bottom`, `--left`, in
TRBL order) and the content's own size (`--width`, `--height`)
as CSS custom properties on the content element. All
positioning happens in CSS. No JS layout math, no `z-index`
management (top layer handles that).

**Resize repositions, scroll dismisses.** `resize` re-runs
`position` for every open surface (the whole `menuStack`,
`popoverShown`, `tooltipShown`) instead of closing it. On Android
the soft keyboard fires a window `resize`, so a popover holding
an input would otherwise close the moment its field gained focus.
Scroll still dismisses. The listener runs in capture so a scroll
inside a nested scroller is seen too; Menu and Popover ignore
scrolls that originate inside their own content, so a scrollable
list in the surface does not close it. A surface that follows a
moving trigger is a different design.

**`toggleDisclosure`.** `toggleDisclosure` flips `aria-expanded`
on the trigger and `hidden` on the `aria-controls` content.
Accordion and Collapsible write through it; they do not set those
attributes themselves.

**Collapsible click-toggles.** A click on `mct:collapsible:` calls
`toggleDisclosure` unless `aria-disabled` is `"true"`. There is
no keyboard of its own: arrows do not rove, and Enter / Space are
the browser's synthesized `click`.

**Exclusive accordion.** Opening an item closes every other open
item on the same `mcr:accordion:` root before `toggleDisclosure`
runs on the trigger. Closing the already-open item does not open
another. A disabled trigger is ignored.

**Accordion item keyboard.** ArrowDown, ArrowUp, Home, and End on
a trigger rove among items via the first-child chain to
`mct:accordion:`. Every Arrow key `preventDefault`s, including
Left and Right which do not rove. There is no `spatialKey`: the
list is vertical.

**Tabs select in one pass.** A click on a tab that is not already
selected walks the list once: that tab and the previously
selected tab flip `aria-selected`, `tabIndex`, and `hidden` on
the linked panel. A panel that already has `tabindex` gets `0`
or `-1` to match. Disabled tabs and a click on the selected tab
are no-ops.

**Tabs orientation.** `aria-orientation="vertical"` uses ArrowDown
and ArrowUp; otherwise ArrowRight and ArrowLeft. Both go through
`spatialKey`. Home and End always rove the list.
