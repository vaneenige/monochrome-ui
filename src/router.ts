type Fetched = [html: string, url: string];

const navigation = typeof document !== "undefined" && window.navigation;
if (navigation) {
  const cache = new Map<string, Promise<Fetched | null>>();
  const parser = new DOMParser();
  const stripHash = (url: string) => url.replace(/#.*/, "");
  let lastKey = stripHash(location.href);

  const fetchPage = (key: string): Promise<Fetched | null> => {
    const hit = cache.get(key);
    if (hit) return hit;
    const promise = (async () => {
      try {
        const response = await fetch(key);
        if (!response.ok || new URL(response.url).origin !== location.origin) {
          return null;
        }
        const result: Fetched = [await response.text(), response.url];
        const pending = cache.get(key);
        if (pending && response.url !== key) cache.set(response.url, pending);
        return result;
      } catch {
        return null;
      }
    })();
    cache.set(key, promise);
    return promise;
  };

  const canHandle = (el: EventTarget | null): el is HTMLAnchorElement =>
    el instanceof HTMLAnchorElement && !el.relList.contains("external");

  const collectAreas = (root: Document | ParentNode) => {
    const map = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-area]").forEach((el) => {
      const name = el.dataset.area;
      if (name && !map.has(name)) map.set(name, el);
    });
    return map;
  };

  const swap = (newDoc: Document) => {
    const incoming = collectAreas(newDoc);
    const current = collectAreas(document);
    const curRoot = current.get("root");
    const newRoot = incoming.get("root");
    if (!curRoot || !newRoot) return;

    const curKey = curRoot.dataset.key;
    let keepRoot = incoming.size === current.size && curKey && curKey === newRoot.dataset.key;
    for (const name of incoming.keys()) keepRoot &&= current.has(name);

    let area = keepRoot ? null : newRoot;
    if (!keepRoot) curRoot.replaceWith(newRoot);
    for (const [name, el] of current) {
      if (el.isConnected) {
        const next = incoming.get(name);
        if (next && (!el.dataset.key || el.dataset.key !== next.dataset.key)) {
          el.replaceWith(next);
          area ||= next;
        }
      }
    }
    area ||= curRoot;
    area.tabIndex = -1;
    area.focus({ preventScroll: true });
    return true;
  };

  const hint = (event: Event) => {
    if (event.target instanceof Element) {
      const anchor = event.target.closest("a");
      if (canHandle(anchor)) void fetchPage(stripHash(anchor.href));
    }
  };
  addEventListener("mouseover", hint);
  addEventListener("focusin", hint);

  navigation.addEventListener("navigate", (event) => {
    const type = event.navigationType;
    const href = event.destination.url;
    if (
      !event.canIntercept ||
      type === "reload" ||
      (event.hashChange && (type === "traverse" || href !== stripHash(href))) ||
      event.downloadRequest !== null ||
      event.formData ||
      !collectAreas(document).has("root") ||
      !(canHandle(event.sourceElement) || type === "traverse")
    ) {
      return;
    }
    const key = stripHash(href);
    const same = key === lastKey;
    const intercept: {
      focusReset: "manual";
      scroll?: "manual";
      handler: () => Promise<void>;
    } = {
      focusReset: "manual",
      handler: async () => {
        if (same) return;
        try {
          const result = await fetchPage(key);
          if (event.signal.aborted) return;
          if (result) {
            const [html, url] = result;
            const newDoc = parser.parseFromString(html, "text/html");
            document.title = newDoc.title;
            if (swap(newDoc)) {
              lastKey = stripHash(url);
              if (lastKey !== key) {
                const hash = href.slice(key.length + 1);
                history.replaceState(history.state, "", hash ? lastKey + "#" + hash : url);
              }
              dispatchEvent(new Event("mc:navigate"));
              return;
            }
          }
        } catch {}
        location.reload();
      },
    };
    if (same) intercept.scroll = "manual";
    event.intercept(intercept);
  });
}
