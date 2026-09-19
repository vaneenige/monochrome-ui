type Fetched = [html: string, url: string];

const navigation = typeof document !== "undefined" && window.navigation;
if (navigation) {
  const cache = new Map<string, Promise<Fetched | null>>();
  const prefetchLimit = 2;
  const prefetchQueue: string[] = [];
  const stripHash = (url: string) => url.replace(/#.*/, "");
  let lastKey = stripHash(location.href);
  let prefetching = 0;

  const fetchPage = (key: string, low?: boolean): Promise<Fetched | null> => {
    const hit = cache.get(key);
    if (hit) return hit;
    const promise = (async () => {
      try {
        const response = await fetch(key, { priority: low ? "low" : "auto" });
        if (!response.ok || new URL(response.url).origin !== location.origin) {
          return null;
        }
        const result: Fetched = [await response.text(), response.url];
        const pending = cache.get(key);
        if (pending && response.url !== key && !cache.has(response.url)) {
          cache.set(response.url, pending);
        }
        return result;
      } catch {
        return null;
      }
    })();
    cache.set(key, promise);
    void promise.then((result) => {
      if (!result) cache.delete(key);
    });
    return promise;
  };

  const canHandle = (el: EventTarget | null): el is HTMLAnchorElement =>
    el instanceof HTMLAnchorElement &&
    el.origin === location.origin &&
    !el.relList.contains("external");

  const canPrefetch = (el: EventTarget | null): el is HTMLAnchorElement =>
    canHandle(el) && !el.hasAttribute("download") && el.target !== "_blank";

  const isHeadIdentity = (el: Element) =>
    el instanceof HTMLTitleElement ||
    el instanceof HTMLMetaElement ||
    (el instanceof HTMLLinkElement && el.relList.contains("canonical")) ||
    (el instanceof HTMLScriptElement && el.type === "application/ld+json");

  const collectAreas = (root: Document | ParentNode) => {
    const map = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-area]").forEach((el) => {
      const name = el.dataset.area;
      if (name && !map.has(name) && !isHeadIdentity(el)) map.set(name, el);
    });
    return map;
  };

  const syncHead = (from: Document) => {
    const nextHead = from.head;
    if (nextHead) {
      let el = document.head.firstElementChild;
      while (el) {
        const next = el.nextElementSibling;
        if (isHeadIdentity(el)) el.remove();
        el = next;
      }
      el = nextHead.firstElementChild;
      while (el) {
        const next = el.nextElementSibling;
        if (isHeadIdentity(el)) document.head.append(el);
        el = next;
      }
    }
  };

  const pumpPrefetch = () => {
    while (prefetching < prefetchLimit) {
      const key = prefetchQueue.shift();
      if (!key) break;
      if (key !== lastKey && !cache.has(key)) {
        prefetching++;
        void fetchPage(key, true).then(() => {
          prefetching--;
          pumpPrefetch();
        });
      }
    }
  };

  const prefetchDocument = () => {
    const nav: Navigator & { connection?: { saveData?: boolean } } = navigator;
    if (
      document.documentElement.dataset.prefetch === "document" &&
      !nav.connection?.saveData &&
      document.querySelector("[data-area=root]")
    ) {
      for (const el of document.links) {
        if (canPrefetch(el)) {
          const key = stripHash(el.href);
          if (key !== lastKey && !cache.has(key) && !prefetchQueue.includes(key)) {
            prefetchQueue.push(key);
          }
        }
      }
      pumpPrefetch();
    } else prefetchQueue.length = 0;
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
        if (next) {
          if (!el.dataset.key || el.dataset.key !== next.dataset.key) {
            el.replaceWith(next);
            if (!document.head.contains(next)) area ||= next;
          }
        } else el.remove();
      }
    }
    syncHead(newDoc);
    area ||= curRoot;
    area.tabIndex = -1;
    area.focus({ preventScroll: true });
    return true;
  };

  const hint = (event: Event) => {
    const node = event.target;
    let el: Element | null =
      node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
    while (el && !(el instanceof HTMLAnchorElement)) el = el.parentElement;
    if (canPrefetch(el)) {
      const key = stripHash(el.href);
      if (key !== lastKey) void fetchPage(key);
    }
  };
  addEventListener("mouseover", hint);
  addEventListener("focusin", hint);
  if (document.readyState === "complete") prefetchDocument();
  else addEventListener("load", prefetchDocument);

  navigation.addEventListener("navigate", (event) => {
    const type = event.navigationType;
    const href = event.destination.url;
    const key = stripHash(href);
    if (
      !event.canIntercept ||
      type === "reload" ||
      (event.hashChange && (type === "traverse" || href !== key)) ||
      event.downloadRequest !== null ||
      event.formData ||
      !(canHandle(event.sourceElement) || type === "traverse") ||
      !document.querySelector("[data-area=root]")
    ) {
      return;
    }
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
            const newDoc = new DOMParser().parseFromString(html, "text/html");
            if (swap(newDoc)) {
              lastKey = stripHash(url);
              if (lastKey !== key) {
                const hash = href.slice(key.length + 1);
                history.replaceState(history.state, "", hash ? lastKey + "#" + hash : url);
              }
              const live = document.documentElement;
              const prefetch = newDoc.documentElement.dataset.prefetch;
              if (prefetch === "document") live.dataset.prefetch = prefetch;
              else delete live.dataset.prefetch;
              dispatchEvent(new Event("mc:navigate"));
              prefetchDocument();
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
