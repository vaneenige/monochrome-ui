# Router

`import "monochrome/router"`. Same-origin Navigation API
intercept: fetch the next page, swap `data-mc-area` regions
whose `data-mc-key` differs, set the title, focus the swapped
area, fire `mc:navigate`. No `window.navigation`: full page
loads.

Needs `data-mc-area="root"`. Matching area names and root keys
keep the current root. Stale work skips the swap. Failure
reloads.

## Prefetch

**Hover, focus, and press prefetch.** `mouseover`, `focusin`,
and `pointerdown` on a same-origin link that would intercept
(not `download`, not `target="_blank"`, not `rel="external"`)
fetch that URL when it is not the current path. Priority stays
`"auto"` and the request starts at once, ahead of the viewport
queue below, which waits for it before starting its next
fetch: the page the reader is reaching for gets the connection
to itself (a fetch the queue already started is not
cancelled). `pointerdown` is the touch path: a tap has no
hover, and the press lands before the `click` that navigates.
Only a primary press counts; a middle press opens a new tab
and a right press a menu, neither of which uses the cache.

**In-memory page cache.** Fetched HTML is stored in a `Map`
keyed by URL, and by the final URL after a same-origin
redirect. In-flight promises are shared, so a click during
prefetch reuses the same request. Only `text/html` responses
are kept; any other type is cancelled unread, so a link to a
file never sits in memory. A failed or non-HTML fetch is
dropped so the next attempt can retry. The map is unbounded
for the life of the page; a full load clears it. Entries
hold raw HTML only.

**Viewport prefetch.** By default the router also hands every
entry of `document.links` to one `IntersectionObserver` once
the reader first interacts with the page (see "Armed by the
first interaction"), and after each successful swap. A link is
fetched when it enters the viewport and passes the same
prefetch filters as hover, so links in a closed menu or drawer
wait until it opens. Fetches run one at a time with fetch
priority `"low"`. A hover, press, or click on a queued link
starts its fetch at once; the queue later finds it in the
cache. Each walk disconnects the observer first, which drops
the previous page's links. Parse still happens on navigate.

**Armed by the first interaction.** The first walk starts on
the first `pointerdown`, `pointermove`, `keydown`, `wheel`, or
`scroll`, whichever comes first (`prefetchArm`); the listeners
are passive, and `prefetchArmed` starts the walk only once. A
page nobody touches spends no bandwidth on pages nobody opens,
and a lab run (Lighthouse never interacts) records no prefetch
at all: a prefetch that finishes before the first paint of a
fast unthrottled load is otherwise charged to the simulated
LCP. On touch the first contact is a `pointerdown`, whether it
becomes a scroll or a tap, so reading arms the walk as early as
it can. A first tap on a link is the one case the walk cannot
have prepared: the press prefetch starts that fetch at
touch-down, ahead of the `click`. A `scroll` without a gesture
(restored scroll on reload, a fragment jump on load) also arms,
which is harmless. A swap re-walks whether or not the page was
armed.

**A still pointer does not arm.** The first `pointermove`
only records where the pointer is (`prefetchPointer`); a later
one at a different point arms. Chromium fires a `pointermove`
at the resting cursor when a page loads under it, so the page
would otherwise arm before the reader does anything.
`movementX` cannot tell the two apart: every engine reports
zero on the first move, and WebKit on every move. The
listeners are not `once` for the same reason: a skipped move
must leave the `pointermove` listener in place for the next.

## Handles

Clicks and Back/Forward to another path. Hash-clear on the
current path (no fetch).

Not: reload, fragment jumps, hash Back/Forward, downloads,
forms, `rel="external"`, cross-origin, new-tab, no root.

Back/Forward scroll restoration and refresh are the browser's.
`history.scrollRestoration` stays `"auto"`.

**A push or replace scrolls by hand.** The intercept takes
`scroll: "manual"`, and `settleScroll` runs after the swap, before
`mc:navigate`: to the URL's fragment if the new page has that
element, else to the top. The browser's own reset after the
transition is not reliable: Safari 26.4 can skip it, so a link
clicked from a scrolled page lands on the new page at the old
offset, with a fixed header inside the swapped root painted
offscreen. Asking the event to scroll early does not help either:
on a traverse WebKit then restores the offset of the entry being
left. Back/Forward keeps the browser's restoration, which WebKit
gets right.

**The click paints before the swap.** A prefetched page resolves
at once, so without a pause the parse, the swap and every
`mc:navigate` listener would run before the click's first paint
and count toward it (Interaction to Next Paint). On a slow phone
that work is the whole interaction. The handler awaits
`afterPaint` after the fetch, a timeout queued from
`requestAnimationFrame` that runs once that frame is drawn, then
checks for abort and swaps. A page still loading costs nothing
extra: the browser paints while the fetch is pending.

The pause pays off only when that frame draws something. Chrome
ends an interaction at the next frame that paints, and a click
that changes nothing on screen (a link whose hover style is
already on) waits for the swap's frame instead: one frame later
than a swap without the pause. So the page gives the clicked link
a visible state on the click, such as the current-page mark in a
sidebar or an `:active` style; the spec says so.

**Anchor resolution.** The navigate event names the element the
navigation started from, and the filters above run on the nearest
`<a>` ancestor of it rather than on that element. Chrome and
WebKit 26.6 (2026-07-27) name the anchor. Safari 26.4
(2026-03-24) and 26.5 (2026-05-11) name the deepest clicked
node, so a link wrapping an icon or a span arrives as that
child and would otherwise fall through to a full page load.
Hover and focus prefetch resolve the same way, from
`event.target`.

`sourceElement` is what sets the Chrome floor: it lands in 135
(2025-04-01), where the rest of the API the router uses is 105
(2022-09-02), which is the trade `browserslist` records. A
navigation no element started, from a script or a form, names
nothing and is left alone.

**A link in an open dialog closes it.** When the navigation
starts, the listener walks up from `sourceElement` to the nearest
`<dialog>` and, if it is open, keeps it as `routerDialog`. Once
the fetch succeeds, and before the swap, the handler calls
`close()` on it. A search or navigation dialog outside the swapped
areas would otherwise stay open, modal, over the new page. The
close waits for the fetch, so a navigation that is aborted, or
whose fetch fails and falls back to a full load, leaves the dialog
as it was, and a link to the current path (no fetch) never closes
it. A `close` listener on `window` (capture: the event does not
bubble) drops `routerDialog` when that dialog closes first, so a
page that closes it on the click, or a reader who closes and
reopens it while the page loads, keeps the dialog they reopened.
Only the dialog holding the link closes; the router names no
other surface.

## Support

```
Browser   Version  Released
Chrome    135      2025-04-01
Safari    26.2     2025-12-12
Firefox   147      2026-01-13
```
