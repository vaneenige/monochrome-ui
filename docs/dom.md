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
candidate the walker visits; if we ever see it again we give
up and set `shouldPreventDefault` so the key does not scroll. A
generic sibling walker can't distinguish "walked past the end
and wrapped" from "kept going past the start", and on an
all-disabled list the naive walker loops forever. One pointer,
zero counters, zero extra passes. A candidate counts only when it
takes focus: each roving callback calls `focus()` and accepts the
candidate once it is `document.activeElement`, so a hidden one
(`hidden`, `display: none`) is skipped like a disabled one
instead of ending the walk with focus still behind it, where
every later key would find it again. The boundary is cleared at
the top of every listener that drives a walk: `keydown` in
Accordion, Tabs, and Menu, and Menu's `pointerup` (the radio
sweep).

**Accordion, Menu, and Tabs bail on chords.** Each `keydown`
listener returns before its switch when Alt, Ctrl, or Meta is
held, so browser and system shortcuts pass through untouched:
Alt+ArrowLeft and Alt+ArrowRight (Back and Forward on Windows
and Linux) would otherwise rove a menubar. Shift is not a chord:
Shift+Tab still leaves a menu, and typeahead matches the shifted
character (see `docs/menu.md`).

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
anything opens on is consumer CSS, told by the side attributes
when its preferred side has no room.

**Popover API with CSS-variable positioning.** `position`
publishes the trigger rect (`--mc-trigger-top`,
`--mc-trigger-right`, `--mc-trigger-bottom`, `--mc-trigger-left`,
in TRBL order) and the content's own size (`--mc-content-width`,
`--mc-content-height`) as CSS custom properties on the content
element. Placement happens in CSS; no `z-index` management (top
layer handles that). The values are a snapshot: `position` runs
when a surface opens, on `resize`, and for a shown tooltip on
scroll, and nothing observes the content, so content that grows
while open keeps its old size and side until the next of those.
The rect is in viewport pixels, which CSS `zoom` on an ancestor
of the content scales a second time, so a zoomed surface lands
off its trigger.

**The core names the side it opened on.** `position` takes the
component's default side (a menu passes `bottom`, or for a submenu
its parent's `data-mc-x`, else the inline end; a popover `bottom`;
a tooltip `top`) and uses the content's `data-mc-side` instead when
it is one of the four sides. `positionSide` then compares the room
on that side of the trigger with the content's size, which
`position` already read: the content stays when it fits, or when
the opposite side has no more room, and otherwise flips. It writes
the result, `data-mc-y="top"` or `"bottom"`, or `data-mc-x="left"`
or `"right"`, and removes the other axis's attribute, so exactly
one is set while the content is open. Stylesheets place from that
result alone: one rule per side and one per alignment, never the
preference combined with a fit. Alignment along the side
(`data-mc-align`) is pure CSS, with no measuring: clamping into the
viewport keeps it on screen. The sides are physical; `start` and
`end` are logical in CSS (`:dir(rtl)`). They are attributes, not
custom properties, because CSS can match an attribute but not a
custom property's value within the Baseline 2024 floor.

**The room on the open side is published too.** For a top or
bottom side, `positionSide` returns the room on the side the
content opens, and `position` writes it as
`--mc-available-height`, raw, so CSS caps a surface too tall for
either side and subtracts its own offset and margin. Before it
measures, `position` sets that property to `initial` and removes
`data-mc-x` and `data-mc-y`: the Required CSS derives its
height cap from those, so the content lays out uncapped and
`--mc-content-height` is its natural height. `initial` rather than
removing the property, because a submenu would otherwise inherit
its parent menu's room and measure capped to it. A cap from an
earlier open therefore never shrinks the measurement, and a surface
reopened with more room flips and sizes as if new. The attributes
come back in the same synchronous call, so nothing renders without
them.
The tooltip reads no cap, and `offsetHeight` leaves out its
hover bridge, so its measurement is unchanged.

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
