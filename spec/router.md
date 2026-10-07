---
title: Router
description: Optional client-side navigation that swaps marked regions of server-rendered pages.
---

# Router

The router turns same-origin link clicks into in-place page swaps.
It fetches the next page's HTML, replaces the regions that changed,
updates the title, moves focus, and fires `mc:navigate`. Your server
keeps rendering whole pages; there are no routes to declare. It is
built on the Navigation API, so Back, Forward, and their scroll
restoration stay the browser's. Browsers without the Navigation
API keep ordinary full page loads.

## Setup

```ts
import "monochrome/router"
```

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/monochrome/dist/router.js"></script>
```

The router is separate from the components and can be used with or
without them.

## Regions

Mark swappable parts of every page with `data-mc-area`. One area must
be named `root`; without it the router does nothing on that page.

```html
<body>
  <header>Site header, never swapped</header>
  <div data-mc-area="root" data-mc-key="docs">
    <nav data-mc-area="sidebar" data-mc-key="docs-nav">Sidebar links</nav>
    <main data-mc-area="content">Page content</main>
  </div>
</body>
```

On navigation the router matches areas by name between the current
and the next page:

- An area whose `data-mc-key` is the same on both pages is kept as it
  is (scroll position, open disclosures, and input all survive).
- An area without a `data-mc-key`, or with a different one, is
  replaced.
- The `root` area is kept only when its `data-mc-key` matches and both
  pages have the same set of area names; otherwise the whole root is
  replaced.
- Areas may also sit in `head` (for example a `meta` tag with
  `data-mc-area`), so page-specific head content swaps too.

After the swap, focus moves to the first replaced area (the router
sets `tabindex="-1"` on it), so screen readers start at the new
content. The document title is set from the new page.

## What it handles

- Clicks on same-origin links to another path. The new page opens
  at the link's `#fragment` when it has that element, else at the
  top. The click paints before the swap, so a prefetched page does
  not hold up the click's response, as long as the click changes
  something on screen. Give the clicked link a visible state on the
  click (mark it current in a sidebar, or style `:active`); else
  the browser counts the click until the swap's paint.
- Back and Forward between pages it handled.
- A link to the current path without a hash clears the hash, with no
  fetch.
- A link inside an open `<dialog>` closes that dialog before the new
  page swaps in, so a search or navigation dialog does not stay open
  over it. A dialog that closed before then, by the page or the
  reader, is left as it is, even when reopened.

## What it skips

These keep the browser's default behaviour:

- Links with `rel="external"`, `target="_blank"`, or `download`.
- Cross-origin links, and redirects that end on another origin.
- Form submissions, reloads, and navigations started by script.
- Fragment jumps (`#section`) and hash-only Back and Forward.
- Pages without `data-mc-area="root"`.
- Modified clicks that open a new tab or window.

Any failure (network error, non-HTML response, a page without a
root) falls back to a full page load of the destination.

## Prefetch

- **Intent**: hovering, focusing, or pressing a link that the router
  would handle starts fetching it at once.
- **Viewport**: after the reader's first interaction (pointer move,
  press, key, wheel, or scroll), every link that enters the viewport
  is fetched in the background, one at a time at low priority. A
  page nobody touches fetches nothing.
- Responses are cached in memory for the life of the page, keyed by
  URL. Only `text/html` is kept. A click during a prefetch reuses the
  same request.
- Links with `rel="external"`, `target="_blank"`, or `download`, and
  links to the current page or another origin, are never prefetched.

To keep a link out of the router and prefetch entirely, add
`rel="external"`.

## Re-running page scripts

Swapped regions are new DOM, and scripts inside fetched HTML do not
run. monochrome components need nothing (their listeners are
global), but your own page code does. Listen for `mc:navigate`,
which fires on `window` after every swap:

```ts
function setup() {
  // bind page-specific behaviour, read the new DOM
}

setup()
addEventListener("mc:navigate", setup)
```

## Browser support

| Browser | Version | Released |
| --- | --- | --- |
| Chrome | 135 | 2025-04-01 |
| Safari | 26.2 | 2025-12-12 |
| Firefox | 147 | 2026-01-13 |

Where `window.navigation` is missing, the import is a no-op and
every link is a normal page load.

## Common mistakes

- No `data-mc-area="root"`. Fix: wrap the swappable page in one.
- Different area names on pages that should share a layout. The
  root is then replaced wholesale. Fix: use the same names on every
  page.
- Initializing page code once at load. Fix: also run it on
  `mc:navigate`.
- Expecting a link to a file (PDF, image) to swap. Non-HTML
  responses fall back to a normal load; mark such links with
  `download` or `rel="external"` to skip the fetch.
