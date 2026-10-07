type Fetched = [html: string, url: string];

const navigation = typeof document !== "undefined" && window.navigation;
if (navigation) {
  const cache = new Map<string, Promise<Fetched | null>>();
  const parser = new DOMParser();
  const origin = location.origin;
  const stripHash = (url: string) => url.replace(/#.*/, "");
  let lastKey = stripHash(location.href);
  let prefetching: Promise<unknown> = Promise.resolve();
  let routerDialog: HTMLDialogElement | null = null;

  const fetchPage = (key: string, init?: RequestInit): Promise<Fetched | null> => {
    const hit = cache.get(key);
    if (hit) return hit;
    const promise = (async () => {
      try {
        const response = await fetch(key, init);
        if (
          response.ok &&
          new URL(response.url).origin === origin &&
          response.headers.get("content-type")?.startsWith("text/html")
        ) {
          const result: Fetched = [await response.text(), response.url];
          const pending = cache.get(key);
          if (pending) cache.set(response.url, pending);
          return result;
        }
        void response.body?.cancel();
      } catch {}
      cache.delete(key);
      return null;
    })();
    cache.set(key, promise);
    return promise;
  };

  const findAnchor = (node: EventTarget | null) => {
    let el = node instanceof Element ? node : null;
    while (el) {
      if (el instanceof HTMLAnchorElement) return el.relList.contains("external") ? null : el;
      el = el.parentElement;
    }
    return null;
  };

  const collectAreas = (root: Document | ParentNode) => {
    const map = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-mc-area]").forEach((el) => {
      const name = el.dataset.mcArea;
      if (name && !map.has(name)) map.set(name, el);
    });
    return map;
  };

  const prefetch = (node: EventTarget | null, init?: RequestInit) => {
    const el = findAnchor(node);
    if (el && el.origin === origin && !el.hasAttribute("download") && el.target !== "_blank") {
      const key = stripHash(el.href);
      if (key !== lastKey) return fetchPage(key, init);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        prefetching = prefetching.then(() => prefetch(entry.target, { priority: "low" }));
      }
    }
  });

  const prefetchDocument = () => {
    observer.disconnect();
    for (const el of document.links) observer.observe(el);
  };

  const swap = (newDoc: Document) => {
    const incoming = collectAreas(newDoc);
    const current = collectAreas(document);
    const curRoot = current.get("root");
    const newRoot = incoming.get("root");
    if (!curRoot || !newRoot) return;

    const curKey = curRoot.dataset.mcKey;
    let keepRoot = incoming.size === current.size && curKey && curKey === newRoot.dataset.mcKey;
    for (const name of incoming.keys()) keepRoot &&= current.has(name);

    let area = keepRoot ? null : newRoot;
    if (!keepRoot) curRoot.replaceWith(newRoot);
    for (const [name, el] of current) {
      if (el.isConnected) {
        const next = incoming.get(name);
        if (next && (!el.dataset.mcKey || el.dataset.mcKey !== next.dataset.mcKey)) {
          if (!document.head.contains(el)) area ||= next;
          el.replaceWith(next);
        }
      }
    }
    area ||= curRoot;
    area.tabIndex = -1;
    area.focus({ preventScroll: true });
    return true;
  };

  const afterPaint = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve)));

  const settleScroll = (href: string) => {
    let id = new URL(href).hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {}
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else scrollTo(0, 0);
  };

  const hint = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.button === 0) {
      const pending = prefetch(event.target);
      if (pending) prefetching = Promise.all([prefetching, pending]);
    }
  };
  addEventListener("mouseover", hint);
  addEventListener("focusin", hint);
  addEventListener("pointerdown", hint);

  let prefetchArmed = false;
  let prefetchPointer: string | null = null;
  const prefetchArm = (event: Event) => {
    if (!prefetchArmed) {
      let willArm = true;
      if (event instanceof PointerEvent && event.type === "pointermove") {
        const at = `${event.clientX},${event.clientY}`;
        willArm = prefetchPointer !== null && prefetchPointer !== at;
        prefetchPointer = at;
      }
      if (willArm) {
        prefetchArmed = true;
        prefetchDocument();
      }
    }
  };
  for (const type of ["pointerdown", "pointermove", "keydown", "wheel", "scroll"])
    addEventListener(type, prefetchArm, { passive: true });

  addEventListener(
    "close",
    (event) => {
      if (event.target === routerDialog) routerDialog = null;
    },
    true,
  );

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
      !(findAnchor(event.sourceElement) || type === "traverse")
    ) {
      return;
    }
    let el = event.sourceElement;
    while (el && !(el instanceof HTMLDialogElement)) el = el.parentElement;
    routerDialog = el instanceof HTMLDialogElement && el.open ? el : null;
    const key = stripHash(href);
    const same = key === lastKey;
    const fresh = type !== "traverse";
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
          await afterPaint();
          if (event.signal.aborted) return;
          if (result) {
            const [html, url] = result;
            routerDialog?.close();
            const newDoc = parser.parseFromString(html, "text/html");
            document.title = newDoc.title;
            if (swap(newDoc)) {
              lastKey = stripHash(url);
              if (lastKey !== key)
                history.replaceState(history.state, "", lastKey + href.slice(key.length));
              if (fresh) settleScroll(href);
              dispatchEvent(new Event("mc:navigate"));
              prefetchDocument();
              return;
            }
          }
        } catch {}
        location.reload();
      },
    };
    if (same || fresh) intercept.scroll = "manual";
    event.intercept(intercept);
  });
}
