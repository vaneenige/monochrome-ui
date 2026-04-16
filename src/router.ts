type Fetched = [html: string, url: string]

if (typeof document !== "undefined") {
  const cache = new Map<string, Promise<Fetched | null>>()
  const parser = new DOMParser()
  let token = 0
  let lastKey = location.origin + location.pathname + location.search

  const stripHash = (url: string) => url.split("#")[0] ?? ""

  const commit = (url: string, pop: boolean) => {
    if (pop) {
      const y = history.state?.scrollY
      scrollTo(0, typeof y === "number" ? y : 0)
    } else {
      history.replaceState({ ...history.state, scrollY: scrollY }, "")
      history.pushState({ scrollY: 0 }, "", url)
      scrollTo(0, 0)
    }
    dispatchEvent(new Event("mc:navigate"))
  }

  const fetchPage = (key: string): Promise<Fetched | null> => {
    const hit = cache.get(key)
    if (hit) return hit
    const promise = (async () => {
      try {
        const response = await fetch(key)
        if (!response.ok) return null
        if (new URL(response.url).origin !== location.origin) return null
        const result: Fetched = [await response.text(), response.url]
        if (response.url !== key) cache.set(response.url, Promise.resolve(result))
        return result
      } catch {
        return null
      }
    })()
    cache.set(key, promise)
    void promise.then((result) => {
      if (result === null) cache.delete(key)
    })
    return promise
  }

  const skip = (anchor: HTMLAnchorElement | null): anchor is null =>
    !anchor ||
    !anchor.href ||
    (anchor.target !== "" && anchor.target !== "_self") ||
    anchor.hasAttribute("download") ||
    anchor.relList.contains("external") ||
    anchor.origin !== location.origin ||
    (anchor.pathname === location.pathname &&
      anchor.search === location.search &&
      anchor.hash !== "")

  const prefetch = (anchor: HTMLAnchorElement) => {
    if (skip(anchor)) return
    const key = stripHash(anchor.href)
    if (!cache.has(key)) void fetchPage(key)
  }

  const collectAreas = (root: Document | ParentNode) => {
    const map = new Map<string, HTMLElement>()
    root.querySelectorAll<HTMLElement>("[data-area]").forEach((el) => {
      const name = el.dataset.area
      if (name && !map.has(name)) map.set(name, el)
    })
    return map
  }

  const swap = (newDoc: Document): boolean => {
    const incoming = collectAreas(newDoc)
    const current = collectAreas(document)

    const curRoot = current.get("root")
    const newRoot = incoming.get("root")
    if (!curRoot || !newRoot) return false

    let sameShape = incoming.size === current.size
    if (sameShape) {
      for (const name of incoming.keys()) {
        if (!current.has(name)) {
          sameShape = false
          break
        }
      }
    }

    const keepRoot =
      sameShape && curRoot.dataset.key !== undefined && curRoot.dataset.key === newRoot.dataset.key

    if (!keepRoot) curRoot.replaceWith(newRoot)
    for (const [name, el] of current) {
      if (name !== "root" && el.isConnected) {
        const next = incoming.get(name)
        if (next && (el.dataset.key === undefined || el.dataset.key !== next.dataset.key)) {
          el.replaceWith(next)
        }
      }
    }
    return true
  }

  const navigateTo = async (href: string, pop: boolean) => {
    if (pop || href !== location.href) {
      const key = stripHash(href)
      if (key !== lastKey) {
        const mine = ++token
        const result = await fetchPage(key)
        if (mine === token) {
          if (result) {
            const [html, url] = result
            const newDoc = parser.parseFromString(html, "text/html")
            document.title = newDoc.title
            if (swap(newDoc)) {
              lastKey = stripHash(url)
              commit(url, pop)
            } else {
              location.href = href
            }
          } else {
            location.href = href
          }
        }
      }
    }
  }

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
        const anchor = event.target.closest("a")
        if (!skip(anchor)) {
          event.preventDefault()
          void navigateTo(anchor.href, false)
        }
      }
    },
    true,
  )

  addEventListener("popstate", () => {
    void navigateTo(location.href, true)
  })

  let lastHint: HTMLAnchorElement | null = null
  const hint = (event: Event) => {
    if (event.target instanceof Element) {
      const anchor = event.target.closest("a")
      if (anchor !== lastHint) {
        lastHint = anchor
        if (anchor) prefetch(anchor)
      }
    }
  }
  addEventListener("mouseover", hint)
  addEventListener("focusin", hint)
}
