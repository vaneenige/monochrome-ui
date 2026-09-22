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

**View transitions.** `viewTransition(origin, update)` runs
`update` inside a same-document view transition when
`viewStart` finds a host, and runs it at once otherwise.
`viewStart` walks up from `origin` to the nearest
`data-view-transition`. `viewport` makes `document` the host;
`element` makes the element carrying the attribute the host;
any other value (`none`) ends the walk with no host. The
method is checked on that host alone, since browsers ship the
document call years before the element call, so `element`
never falls back to the document. `prefers-reduced-motion:
reduce` also yields no host. When a transition starts, the
browser calls `update` after it snapshots the old state.

**One batch per transition.** A `viewTransition` call with a
host joins the batch already waiting for its snapshot, and the
first host wins. Calls made while a batch runs (`viewRunning`)
run at once, so Accordion's exclusive close and its open, and
the popover a new one replaces, land in one snapshot. A call
with no host never joins a batch; it runs at once, so an
un-opted component is never delayed by another one's
transition. Each update in a batch runs on its own: a throw is
passed to `reportError` and the rest still run.

**Input applies a pending batch first.** `src/dom.ts` registers
`viewGuard` in capture on `window` for `pointerdown`,
`pointerup`, `click`, `pointermove`, and `keydown`, ahead of
every component listener. When a batch is still waiting,
`pointerdown`, `pointerup`, `click`, and `keydown` run it at
once and call `skipTransition` on its transition, so no
handler ever reads the state from before the last event: Enter
then Escape closes a popover, and Tab after opening a dialog
moves inside it. `pointermove` does not apply the batch, so a
moving pointer never cancels a transition.

**Input on a running transition is dropped.** While a
transition animates, the browser hit-tests its snapshots, not
the page, and Chromium reports pointer events on the
`<html>` element. `viewGuard` stops those at the capture
listener and cancels `pointerdown`, so they never reach a
component: the press does not read as outside a popover, and
focus does not leave a modal dialog. `viewActive` counts the
transitions between start and `finished`. Keyboard input is
never dropped.

**Transitions never fail loudly.** A `startViewTransition` that
throws runs the batch at once. `ready` rejects when the browser
skips a transition (a duplicate `view-transition-name`, a
second document transition, `skipTransition`); `viewTransition`
handles it, and the batch still runs, as the API guarantees.

**Where the walk starts.** Disclosure, Dialog, and Popover
start at the content they show or hide. Tabs starts at the
tab, so the attribute belongs on the tabs root, and an
`element` transition there covers the list and every panel.
Menu, Menubar, Tooltip, and the router never call
`viewTransition`: they act on hover and on the press itself,
where dropped input would break them. Dialog's own close
requests are in `docs/dialog.md`.
