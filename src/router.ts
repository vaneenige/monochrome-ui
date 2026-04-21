/**
 * @file Client-side router: optional companion to the core.
 *
 * ## What it does
 *
 * - Intercepts plain in-origin `<a>` clicks and swaps marked page
 *   regions (`data-area="..."`) without a full reload.
 * - Prefetches any link that gets a pointer or focus hint.
 * - Preserves scroll position across back/forward navigation.
 * - Falls back to a hard navigation whenever the assumptions break
 *   (cross-origin, network error, missing root area, etc.).
 *
 * ## Design
 *
 * Two small ideas carry the whole router:
 *
 * 1. **Pages declare "areas" with `data-area`.** The area named
 *    `"root"` is required; everything else is optional. On
 *    navigation, we fetch the new page, parse its HTML, and swap
 *    matching areas whose `data-key` differs (or which lack a key).
 *    A page whose area shape differs triggers a root replacement.
 *
 * 2. **Token-guarded async.** Every `navigateTo` increments a token;
 *    when its fetch resolves it checks the token is still the
 *    latest. Stale navigations (user clicked again) drop silently.
 *
 * All behaviour is synchronous from the user's perspective; the
 * only awaits are `fetch` and `response.text()`.
 *
 * ## Comment convention
 *
 * Same standard as `src/index.ts`: TSDoc for declarations, `//` for
 * inline notes. Comments are stripped by `build.ts` before bundling.
 */

/** A successful fetch: the page HTML and the resolved URL. */
type Fetched = [html: string, url: string];

// SSR guard: do nothing when `document` is undefined.
if (typeof document !== "undefined") {
	/**
	 * Fetch cache keyed by URL (hash stripped). Values are the
	 * in-flight or resolved promise so concurrent requests de-dupe.
	 * A failed fetch removes its entry so retries are possible.
	 */
	const cache = new Map<string, Promise<Fetched | null>>();

	/** Shared parser: creating a new `DOMParser` each call is wasteful. */
	const parser = new DOMParser();

	/**
	 * Monotonic token to discard stale navigations. Incremented on
	 * every `navigateTo`; only the call whose token still matches
	 * when its fetch resolves is allowed to commit.
	 */
	let token = 0;

	/**
	 * Last URL we actually committed (hash stripped). Acts as a
	 * guard against re-navigating to the same page on hash-only
	 * changes, which the browser handles natively.
	 */
	let lastKey = location.origin + location.pathname + location.search;

	/** Strip the `#fragment` from a URL for cache and comparison keys. */
	const stripHash = (url: string) => url.split("#")[0] ?? "";

	/**
	 * Commit a successful navigation: update scroll + history + fire
	 * `mc:navigate` for any downstream listeners.
	 *
	 * For push navigations we snapshot the current scroll position
	 * onto the outgoing history entry (so back-navigation can
	 * restore it), push the new entry with a fresh scroll state, and
	 * scroll to top. For pop navigations we just restore whatever
	 * scroll was saved on the entry we're returning to.
	 */
	const commit = (url: string, pop: boolean) => {
		if (pop) {
			const y = history.state?.scrollY;
			scrollTo(0, typeof y === "number" ? y : 0);
		} else {
			history.replaceState({ ...history.state, scrollY: scrollY }, "");
			history.pushState({ scrollY: 0 }, "", url);
			scrollTo(0, 0);
		}
		dispatchEvent(new Event("mc:navigate"));
	};

	/**
	 * Fetch a page and cache the result. Returns `null` for network
	 * errors, non-2xx responses, or cross-origin redirects (any of
	 * which should fall back to a full browser navigation).
	 *
	 * If the response's final URL differs from the requested key
	 * (redirect), the result is also cached under the final URL so
	 * subsequent requests to either form hit the cache.
	 */
	const fetchPage = (key: string): Promise<Fetched | null> => {
		const hit = cache.get(key);
		if (hit) return hit;
		const promise = (async () => {
			try {
				const response = await fetch(key);
				if (!response.ok) return null;
				if (new URL(response.url).origin !== location.origin) return null;
				const result: Fetched = [await response.text(), response.url];
				if (response.url !== key)
					cache.set(response.url, Promise.resolve(result));
				return result;
			} catch {
				return null;
			}
		})();
		cache.set(key, promise);
		// Evict failed fetches so a retry is possible.
		void promise.then((result) => {
			if (result === null) cache.delete(key);
		});
		return promise;
	};

	/**
	 * Decide whether an anchor should be handled by the router
	 * (returns `true`) or left to the browser (returns `false`).
	 * Handled when all of:
	 *
	 * - Non-null with an `href`.
	 * - `target` is `""` or `"_self"` (not new tab/window).
	 * - No `download` attribute (file save).
	 * - No `rel="external"` (explicit opt-out).
	 * - Same-origin.
	 * - Not a same-URL hash-only change (let the browser jump).
	 *
	 * The positive `is HTMLAnchorElement` predicate narrows correctly
	 * in both branches: callers read the `true` branch as "safe to use".
	 */
	const canHandle = (
		anchor: HTMLAnchorElement | null,
	): anchor is HTMLAnchorElement =>
		!!anchor?.href &&
		(anchor.target === "" || anchor.target === "_self") &&
		!anchor.hasAttribute("download") &&
		!anchor.relList.contains("external") &&
		anchor.origin === location.origin &&
		!(
			anchor.pathname === location.pathname &&
			anchor.search === location.search &&
			anchor.hash !== ""
		);

	/** Warm the cache for an anchor that looks hover-intent-ful. */
	const prefetch = (anchor: HTMLAnchorElement) => {
		if (!canHandle(anchor)) return;
		const key = stripHash(anchor.href);
		if (!cache.has(key)) void fetchPage(key);
	};

	/**
	 * Collect the named `data-area` elements reachable in a document
	 * or parent node. Returns a `name -> element` map. When multiple
	 * elements share a name, the first wins (arbitrary but stable).
	 */
	const collectAreas = (root: Document | ParentNode) => {
		const map = new Map<string, HTMLElement>();
		root.querySelectorAll<HTMLElement>("[data-area]").forEach((el) => {
			const name = el.dataset.area;
			if (name && !map.has(name)) map.set(name, el);
		});
		return map;
	};

	/**
	 * Swap the current document's areas for the incoming document's.
	 * Returns `false` when the swap is impossible (no root area on
	 * either side), signalling the caller to fall back to a full
	 * navigation.
	 *
	 * Swap rules, in order:
	 *
	 * 1. Both documents must have a `data-area="root"`.
	 * 2. If the set of area names matches *and* both roots carry the
	 *    same `data-key`, keep the current root (preserves DOM state
	 *    inside it: form values, scroll, open components).
	 * 3. Otherwise, replace the root entirely.
	 * 4. For every other current area still connected, replace it
	 *    with the incoming equivalent *only* if `data-key` differs
	 *    (or neither side has a key). Areas with matching keys are
	 *    preserved.
	 *
	 * This "keyed swap" lets pages keep sidebars, shells, or layouts
	 * across navigations while still diffing content regions.
	 */
	const swap = (newDoc: Document): boolean => {
		const incoming = collectAreas(newDoc);
		const current = collectAreas(document);

		const curRoot = current.get("root");
		const newRoot = incoming.get("root");
		if (!curRoot || !newRoot) return false;

		// Shape check: identical set of area names on both sides.
		let sameShape = incoming.size === current.size;
		if (sameShape) {
			for (const name of incoming.keys()) {
				if (!current.has(name)) {
					sameShape = false;
					break;
				}
			}
		}

		const keepRoot =
			sameShape &&
			curRoot.dataset.key !== undefined &&
			curRoot.dataset.key === newRoot.dataset.key;

		if (!keepRoot) curRoot.replaceWith(newRoot);
		for (const [name, el] of current) {
			if (name !== "root" && el.isConnected) {
				const next = incoming.get(name);
				if (
					next &&
					(el.dataset.key === undefined || el.dataset.key !== next.dataset.key)
				) {
					el.replaceWith(next);
				}
			}
		}
		return true;
	};

	/**
	 * Navigate to `href`. `pop` is `true` for back/forward navigations
	 * (scroll restored from history state, no pushState). Falls back
	 * to a full browser navigation when the fetch fails, the shape
	 * doesn't permit swapping, or anything else throws.
	 *
	 * The `token` / `mine` dance is what makes rapid-fire clicking
	 * safe: only the latest navigation's callback is allowed to
	 * touch the DOM, so a slow fetch can't stomp a later fast one.
	 */
	const navigateTo = async (href: string, pop: boolean) => {
		if (pop || href !== location.href) {
			const key = stripHash(href);
			if (key !== lastKey) {
				const mine = ++token;
				const result = await fetchPage(key);
				if (mine === token) {
					if (result) {
						const [html, url] = result;
						const newDoc = parser.parseFromString(html, "text/html");
						document.title = newDoc.title;
						if (swap(newDoc)) {
							lastKey = stripHash(url);
							commit(url, pop);
						} else {
							location.href = href;
						}
					} else {
						location.href = href;
					}
				}
			}
		}
	};

	/**
	 * Click capture: hijack left-clicks on plain internal anchors.
	 * Modifier keys are left untouched (Cmd-click → new tab is the
	 * browser's job). Uses the capture phase so we can `preventDefault`
	 * before any app-level listener sees it.
	 */
	addEventListener(
		"click",
		(event: MouseEvent) => {
			if (
				!event.defaultPrevented &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.shiftKey &&
				!event.altKey &&
				event.button === 0 &&
				event.target instanceof Element
			) {
				const anchor = event.target.closest("a");
				if (canHandle(anchor)) {
					event.preventDefault();
					void navigateTo(anchor.href, false);
				}
			}
		},
		true,
	);

	/** Back/forward button: always navigate, even to the same URL. */
	addEventListener("popstate", () => {
		void navigateTo(location.href, true);
	});

	/**
	 * Prefetch hints. `mouseover` and `focusin` both fire when the
	 * user expresses intent to follow a link; prefetching on either
	 * speeds up the eventual click/Enter. `lastHint` deduplicates
	 * consecutive hover events on the same anchor so we don't refetch.
	 */
	let lastHint: HTMLAnchorElement | null = null;
	const hint = (event: Event) => {
		if (event.target instanceof Element) {
			const anchor = event.target.closest("a");
			if (anchor !== lastHint) {
				lastHint = anchor;
				if (anchor) prefetch(anchor);
			}
		}
	};
	addEventListener("mouseover", hint);
	addEventListener("focusin", hint);
}
