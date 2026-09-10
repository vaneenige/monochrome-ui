# Router

`import "monochrome/router"`. Same-origin Navigation API
intercept: fetch the next page, swap `data-area` regions
whose `data-key` differs, set the title, focus the swapped
area, fire `mc:navigate`. No `window.navigation`: full page
loads.

Needs `data-area="root"`. Matching area names and root keys
keep the current root. Prefetch on hover and focus. Pages
stay cached for the session. Stale work skips the swap.
Failure reloads.

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
