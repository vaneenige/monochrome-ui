# Router

`import "monochrome/router"`. Same-origin Navigation API
intercept: fetch the next page, swap `data-area` regions
whose `data-key` differs, replace document identity in
`head`, focus the swapped area, fire `mc:navigate`. No
`window.navigation`: full page loads.

**`data-area` and `data-key`.** A page needs
`data-area="root"`. On swap, the router collects named areas
from the current and incoming documents. It keeps the current
root when both sides list the same names and the root
`data-key` values match. Otherwise it replaces the root.
Connected areas whose `data-key` is missing or differs are
replaced. An area the new page does not declare is removed.
Focus moves to the first replaced body area, or the root if
none was replaced. Stale aborted work skips the swap. A
failed fetch or swap reloads.

**Head identity.** After the area swap, live `title`, `meta`,
canonical `link`, and JSON-LD scripts are removed from
`document.head`, then those nodes move in from the incoming
document. Stylesheets, module scripts, icons, and preloads
stay. `title` is the incoming element, not a
`document.title` write.

**Hover and focus prefetch.** `mouseover` and `focusin` on a
same-origin link that would intercept (not `download`, not
`target="_blank"`, not `rel="external"`) fetch that URL when
it is not the current path. Priority stays `"auto"`. This
path runs whether or not `data-prefetch` is set, and
Save-Data does not stop it.

**In-memory page cache.** Fetched HTML is stored in a `Map`
keyed by URL, and by the final URL after a same-origin
redirect. In-flight promises are shared, so a click during
prefetch reuses the same request. A failed fetch is dropped
so the next attempt can retry. The map lives for the life of
the page; a full load clears it. Entries hold raw HTML only.

**Document prefetch.** `data-prefetch="document"` on `<html>`
also walks `document.links` after `load` and after each
successful swap, queueing URLs that pass the same prefetch
filters as hover. At most two fetches run at a time, each
with fetch priority `"low"`. Save-Data skips that walk and
clears the queue. Parse still happens on navigate. After a
swap, incoming `<html>` copies `data-prefetch="document"`
onto the live document or removes the attribute, so the next
walk follows the new page.

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
