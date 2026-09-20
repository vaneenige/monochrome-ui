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

## Support

```
Browser   Version  Released
Chrome    135      2025-04-01
Edge      135      2025-04-03
Safari    26.2     2025-12-12
Firefox   147      2026-01-13
```
