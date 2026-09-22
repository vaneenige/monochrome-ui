# Router

`import "monochrome/router"`. Same-origin Navigation API
intercept: fetch the next page, swap `data-area` regions
whose `data-key` differs, set the title, focus the swapped
area, fire `mc:navigate`. No `window.navigation`: full page
loads.

Needs `data-area="root"`. Matching area names and root keys
keep the current root. Stale work skips the swap. Failure
reloads.

## Prefetch

**Hover and focus prefetch.** `mouseover` and `focusin` on a
same-origin link that would intercept (not `download`, not
`target="_blank"`, not `rel="external"`) fetch that URL when
it is not the current path. Priority stays `"auto"` and the
request starts at once, ahead of the viewport queue below.

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
entry of `document.links` to one `IntersectionObserver` on
`load` and after each successful swap. A link is fetched when
it enters the viewport and passes the same prefetch filters
as hover, so links in a closed menu or drawer wait until it
opens. Fetches run one at a time with fetch priority `"low"`.
A hover or click on a queued link starts its fetch at once;
the queue later finds it in the cache. Each walk disconnects
the observer first, which drops the previous page's links.
Parse still happens on navigate. A router imported after
`load` first observes at its first swap.

## Handles

Clicks and Back/Forward to another path. Hash-clear on the
current path (no fetch).

Not: reload, fragment jumps, hash Back/Forward, downloads,
forms, `rel="external"`, cross-origin, new-tab, no root.

Scroll, fragments, and refresh are the browser's.
`history.scrollRestoration` stays `"auto"`.

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

## Support

```
Browser   Version  Released
Chrome    135      2025-04-01
Safari    26.2     2025-12-12
Firefox   147      2026-01-13
```
