import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.describe("Router", () => {
  test.beforeEach(async ({ renderer }) => {
    test.skip(
      renderer !== "html",
      "Router is renderer-agnostic; only tested once via the html project",
    );
  });

  const recordFetches = async (page: Page) => {
    const urls: string[] = [];
    await page.route("**/*", (route) => {
      urls.push(route.request().url());
      void route.continue();
    });
    return urls;
  };

  // Stubs IntersectionObserver so the viewport walk never fires and hover and focus are
  // the only prefetch path under test.
  const hoverOnly = (page: Page) =>
    page.addInitScript(() => {
      window.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
        root = null;
        rootMargin = "";
        scrollMargin = "";
        thresholds = [];
      };
    });

  test.describe("Root swap", () => {
    test("swaps the root area on anchor click", async ({ page }) => {
      await page.goto("/html/router/index");
      await expect(page.getByTestId("page-title")).toHaveText("Home");
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
    });

    test("updates the document title", async ({ page }) => {
      await page.goto("/html/router/index");
      await expect(page).toHaveTitle("Home");
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveTitle("About");
    });

    test("moves focus to the root area", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.getByTestId("nav-about").click();
      await expect(page.getByTestId("page-title")).toHaveText("About");
      await expect(page.locator("[data-area='root']")).toBeFocused();
    });

    test("moves focus to the replaced region when the root is kept", async ({ page }) => {
      await page.goto("/html/router/docs");
      await page.getByTestId("nav-docs-guide").click();
      await expect(page.getByTestId("page-title")).toHaveText("Docs Guide");
      await expect(page.locator("[data-area='content']")).toBeFocused();
    });

    test("preserves the JS context across navigation", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 42;
      });
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(42);
    });

    test("never replaces the body or head", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        document.body.setAttribute("data-preserved-body", "yes");
        document.head.setAttribute("data-preserved-head", "yes");
      });
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      expect(await page.locator("body").getAttribute("data-preserved-body")).toBe("yes");
      expect(await page.locator("head").getAttribute("data-preserved-head")).toBe("yes");
    });

    test("preserves siblings outside the root area", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        document.querySelector("nav")?.setAttribute("data-preserved", "yes");
      });
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      expect(await page.locator("nav").getAttribute("data-preserved")).toBe("yes");
    });

    test("swaps `data-area` elements in the head during a root swap", async ({ page }) => {
      await page.goto("/html/router/index");
      await expect(page.locator("meta[data-area='head-meta']")).toHaveAttribute("content", "index");
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.locator("meta[data-area='head-meta']")).toHaveAttribute("content", "about");
    });
  });

  test.describe("Structural mismatch", () => {
    test("falls back to a root swap when the new page introduces new areas", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.getByTestId("nav-docs").click();
      await expect(page).toHaveURL("/html/router/docs");
      await expect(page.getByTestId("page-title")).toHaveText("Docs");
      await expect(page.locator("[data-area='sidebar']")).toBeVisible();
    });

    test("hard-reloads when falling back without a root area", async ({ page }) => {
      await page.goto("/html/router/no-root");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.evaluate(() => {
        const link = document.createElement("a");
        link.href = "/html/router/docs";
        document.body.appendChild(link);
        link.click();
      });
      await page.waitForURL("**/html/router/docs");
      await expect(page.getByTestId("page-title")).toHaveText("Docs");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBeUndefined();
    });
  });

  test.describe("Area keys", () => {
    test("preserves an area whose `data-key` matches across pages", async ({ page }) => {
      await page.goto("/html/router/docs");
      await page.evaluate(() => {
        document.querySelector("[data-area='sidebar']")?.setAttribute("data-preserved", "yes");
      });
      await page.getByTestId("nav-docs-guide").click();
      await expect(page).toHaveURL("/html/router/docs-guide");
      await expect(page.getByTestId("page-title")).toHaveText("Docs Guide");
      expect(await page.locator("[data-area='sidebar']").getAttribute("data-preserved")).toBe(
        "yes",
      );
    });

    test("swaps an area whose `data-key` differs across pages", async ({ page }) => {
      await page.goto("/html/router/docs");
      await page.evaluate(() => {
        document.querySelector("[data-area='sidebar']")?.setAttribute("data-preserved", "yes");
      });
      await page.getByTestId("nav-reference").click();
      await expect(page).toHaveURL("/html/router/reference");
      await expect(page.getByTestId("page-title")).toHaveText("Reference");
      expect(await page.locator("[data-area='sidebar']").getAttribute("data-preserved")).toBeNull();
    });
  });

  test.describe("Anchor filtering", () => {
    test("swaps when the click lands on an element inside the link", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("nav-about-label").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(1);
    });

    test("swaps when the click lands on an SVG inside the link", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("nav-about-rect").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(1);
    });

    test("swaps when the navigate event names an element inside the link", async ({ page }) => {
      // Safari 26.4 and 26.5 report the deepest clicked node as `sourceElement`
      // instead of the anchor; WebKit 26.6 reports the anchor. Reshaping the
      // getter keeps the regression covered on every engine.
      await page.addInitScript(() => {
        const native = Object.getOwnPropertyDescriptor(NavigateEvent.prototype, "sourceElement");
        let clicked: EventTarget | null = null;
        addEventListener("pointerdown", (event) => (clicked = event.target), true);
        Object.defineProperty(NavigateEvent.prototype, "sourceElement", {
          configurable: true,
          get(this: NavigateEvent) {
            return clicked || native?.get?.call(this);
          },
        });
      });
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("nav-about-label").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(1);
    });

    test("ignores a script navigation", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.evaluate(() => {
        location.href = "/html/router/about";
      });
      await page.waitForURL("/html/router/about");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBeUndefined();
    });

    test("ignores modifier-clicked links", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.getByTestId("nav-about").click({ modifiers: ["ControlOrMeta"] });
      await expect(page).toHaveURL("/html/router/index");
      await expect(page.getByTestId("page-title")).toHaveText("Home");
    });

    test("ignores `target=_blank` links", async ({ page, context }) => {
      await page.goto("/html/router/ignored");
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.getByTestId("blank-link").click(),
      ]);
      await newPage.waitForLoadState();
      await expect(page).toHaveURL("/html/router/ignored");
      await newPage.close();
    });

    test("ignores `download` links", async ({ page }) => {
      await page.goto("/html/router/ignored");
      await page.evaluate(() => {
        document
          .querySelector<HTMLAnchorElement>("[data-testid='download-link']")
          ?.addEventListener("click", (e) => e.preventDefault(), {
            once: true,
          });
      });
      await page.getByTestId("download-link").click();
      await page.waitForTimeout(80);
      await expect(page).toHaveURL("/html/router/ignored");
      await expect(page.getByTestId("page-marker")).toHaveText("ignored");
    });

    test("ignores cross-origin links", async ({ page }) => {
      await page.goto("/html/router/ignored");
      await page.evaluate(() => {
        document
          .querySelector<HTMLAnchorElement>("[data-testid='external-link']")
          ?.addEventListener("click", (e) => e.preventDefault(), {
            once: true,
          });
      });
      await page.getByTestId("external-link").click();
      await page.waitForTimeout(80);
      await expect(page).toHaveURL("/html/router/ignored");
      await expect(page.getByTestId("page-marker")).toHaveText("ignored");
    });

    test("ignores `rel=external` links", async ({ page }) => {
      await page.goto("/html/router/ignored");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("rel-external-link").click();
      await expect(page).toHaveURL("/html/router/no-root");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBeUndefined();
    });

    test("ignores same-page hash links", async ({ page }) => {
      await page.goto("/html/router/ignored");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("hash-link").click();
      await expect(page).toHaveURL("/html/router/ignored#anchor");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(1);
    });

    test("a hash-less link to the current page clears the hash without reloading", async ({
      page,
    }) => {
      await page.goto("/html/router/ignored");
      await page.getByTestId("hash-link").click();
      await expect(page).toHaveURL("/html/router/ignored#anchor");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("self-link").click();
      await expect(page).toHaveURL("/html/router/ignored");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(1);
    });
  });

  test.describe("History", () => {
    test("carries a #fragment across a cross-page navigation and scrolls to it", async ({
      page,
    }) => {
      await page.goto("/html/router/frag-source");
      await page.evaluate(() => {
        window.__sentinel = 7;
      });
      await page.getByTestId("frag-link").click();
      await expect(page).toHaveURL("/html/router/frag-target#section");
      await expect(page.getByTestId("page-title")).toHaveText("Frag Target");
      // The sentinel survives only if the router swapped in place; a
      // full browser navigation would have wiped it.
      expect(await page.evaluate(() => window.__sentinel)).toBe(7);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const section = document.getElementById("section");
            return section ? Math.abs(window.scrollY - section.offsetTop) < 100 : false;
          }),
        )
        .toBe(true);
    });

    test("leaves scroll restoration to the browser", async ({ page }) => {
      await page.goto("/html/router/index");
      const mode = await page.evaluate(() => history.scrollRestoration);
      expect(mode).toBe("auto");
    });

    test("handles back navigation", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.getByTestId("nav-about").click();
      await expect(page.getByTestId("page-title")).toHaveText("About");
      await page.evaluate(() => {
        window.__sentinel = 99;
      });
      await page.goBack();
      await expect(page).toHaveURL("/html/router/index");
      await expect(page.getByTestId("page-title")).toHaveText("Home");
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBe(99);
    });

    test("restores scroll across native hash navigations", async ({ page }) => {
      await page.goto("/html/router/hash");
      await page.evaluate(() => window.scrollTo(0, 400));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400);
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='hash-link']")?.click();
      });
      await expect(page).toHaveURL("/html/router/hash#section");
      await page.goBack();
      await expect(page).toHaveURL("/html/router/hash");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400);
    });

    test("forward to a hash entry lands on the fragment target", async ({ page }) => {
      await page.goto("/html/router/hash");
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='hash-link']")?.click();
      });
      await expect(page).toHaveURL("/html/router/hash#section");
      await page.goBack();
      await expect(page).toHaveURL("/html/router/hash");
      await page.goForward();
      await expect(page).toHaveURL("/html/router/hash#section");
      await expect
        .poll(() =>
          page.evaluate(() => {
            const section = document.getElementById("section");
            return section ? Math.abs(window.scrollY - section.offsetTop) < 100 : false;
          }),
        )
        .toBe(true);
    });

    test("restores scroll position on back navigation", async ({ page }) => {
      await page.goto("/html/router/scroll");
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='link-next']")?.click();
      });
      await expect(page).toHaveURL("/html/router/scroll-other");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.goBack();
      await expect(page).toHaveURL("/html/router/scroll");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
    });

    test("restores scroll position on reload", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "Playwright WebKit does not restore scroll on reload");
      await page.goto("/html/router/scroll");
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
      await page.reload();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
    });
  });

  test.describe("Fallback", () => {
    test("falls back to real navigation when fetch returns 404", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      const loaded = page.waitForEvent("load");
      await page.getByTestId("nav-missing").click();
      await loaded;
      await expect(page).toHaveURL(/does-not-exist/);
      const sentinel = await page.evaluate(() => window.__sentinel);
      expect(sentinel).toBeUndefined();
    });
  });

  test.describe("Redirects", () => {
    test("follows a same-origin redirect and lands on the final URL", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.getByTestId("nav-redirect").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
    });

    test("falls back to real navigation on a cross-origin redirect", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      const navigated = page.waitForEvent("framenavigated", { timeout: 3000 }).catch(() => null);
      await page.getByTestId("nav-redirect-ext").click();
      await navigated;
      const url = page.url();
      expect(url).not.toContain("/html/router/about");
    });

    test("caches the redirected page under the final URL", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.getByTestId("nav-redirect").click();
      await expect(page).toHaveURL("/html/router/about");
      await page.goBack();
      await expect(page).toHaveURL("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      expect(fetched.some((u) => u.endsWith("/html/router/about"))).toBe(false);
    });
  });

  test.describe("Prefetching", () => {
    test("prefetches a link on hover", async ({ page }) => {
      await hoverOnly(page);
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").hover();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
    });

    test("prefetches a link on keyboard focus", async ({ page }) => {
      await hoverOnly(page);
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").focus();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
    });

    test("uses cached HTML on navigation after hover", async ({ page }) => {
      await hoverOnly(page);
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").hover();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      const before = fetched.length;
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      expect(fetched).toHaveLength(before);
    });

    test("retries after a failed prefetch", async ({ page }) => {
      await hoverOnly(page);
      let attempts = 0;
      await page.route("**/html/router/about", async (route) => {
        if (route.request().resourceType() === "fetch") {
          attempts++;
          if (attempts === 1) {
            await route.fulfill({ status: 500, body: "no" });
            return;
          }
        }
        await route.continue();
      });
      await page.goto("/html/router/index");
      await expect
        .poll(async () => {
          await page.getByTestId("nav-home").hover();
          await page.getByTestId("nav-about").hover();
          return attempts;
        })
        .toBe(2);
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      expect(attempts).toBe(2);
    });

    test("does not prefetch the current path", async ({ page }) => {
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-home").hover();
      await page.waitForTimeout(80);
      expect(fetched.some((u) => u.includes("/html/router/index"))).toBe(false);
    });

    test("does not prefetch a cross-origin link", async ({ page }) => {
      await page.goto("/html/router/ignored");
      const fetched = await recordFetches(page);
      await page.getByTestId("external-link").hover();
      await page.waitForTimeout(80);
      expect(fetched.some((u) => u.includes("example.com"))).toBe(false);
    });

    test("does not prefetch a `download` link", async ({ page }) => {
      await page.goto("/html/router/ignored");
      const fetched = await recordFetches(page);
      await page.getByTestId("download-link").hover();
      await page.waitForTimeout(80);
      expect(fetched.some((u) => u.includes("/html/router/about"))).toBe(false);
    });

    test("does not prefetch a `target=_blank` link", async ({ page }) => {
      await page.goto("/html/router/ignored");
      const fetched = await recordFetches(page);
      await page.getByTestId("blank-link").hover();
      await page.waitForTimeout(80);
      expect(fetched.some((u) => u.includes("/html/router/about"))).toBe(false);
    });

    test("does not prefetch a `rel=external` link", async ({ page }) => {
      await page.goto("/html/router/ignored");
      const fetched = await recordFetches(page);
      await page.getByTestId("rel-external-link").hover();
      await page.waitForTimeout(80);
      expect(fetched.some((u) => u.includes("/html/router/no-root"))).toBe(false);
    });

    test("a full load drops cached pages", async ({ page }) => {
      await hoverOnly(page);
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").hover();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      const before = fetched.filter((u) => u.endsWith("/html/router/about")).length;
      // Firefox re-dispatches mouseover on the fresh document if the pointer is still
      // over the link, which would prefetch before the click and hide what we measure.
      await page.mouse.move(0, 0);
      await page.reload();
      await expect(page.getByTestId("page-title")).toHaveText("Home");
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      expect(fetched.filter((u) => u.endsWith("/html/router/about")).length).toBeGreaterThan(
        before,
      );
    });

    test("hover prefetch keeps the default priority", async ({ page }) => {
      await hoverOnly(page);
      await page.addInitScript(() => {
        const original = fetch.bind(window);
        window.fetch = (input, init) => {
          const url = input instanceof Request ? input.url : String(input);
          (window.__fetchPriority ??= []).push([url, init?.priority]);
          return original(input, init);
        };
      });
      await page.goto("/html/router/index");
      await page.getByTestId("nav-about").hover();
      await expect
        .poll(() =>
          page.evaluate(() =>
            (window.__fetchPriority ?? []).some(
              ([url, priority]) => url.endsWith("/html/router/about") && priority !== "low",
            ),
          ),
        )
        .toBe(true);
    });
  });

  test.describe("Prefetching (viewport)", () => {
    test("waits for the reader's first interaction", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.waitForLoadState("networkidle");
      expect(fetched.some((u) => u.endsWith("/html/router/about"))).toBe(false);
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
    });

    for (const [name, interact] of [
      [
        "a touch",
        (page: Page) =>
          page.dispatchEvent("body", "pointerdown", { pointerType: "touch", bubbles: true }),
      ],
      ["a pointer move", (page: Page) => page.mouse.move(1, 1)],
      // Dispatched rather than `mouse.wheel`: headless WebKit drops some synthesized
      // wheel gestures before they reach the page.
      ["a wheel", (page: Page) => page.dispatchEvent("body", "wheel", { bubbles: true })],
      ["a scroll", (page: Page) => page.evaluate(() => scrollTo(0, 1))],
    ] as const) {
      test(`arms on ${name}`, async ({ page }) => {
        const fetched = await recordFetches(page);
        await page.goto("/html/router/prefetch");
        await interact(page);
        await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      });
    }

    test("fetches visible links once armed", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/docs"))).toBe(true);
    });

    test("does not fetch the current path, downloads, or cross-origin", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect
        .poll(() => fetched.some((u) => u.endsWith("/html/router/prefetch-off")))
        .toBe(true);
      await page.waitForLoadState("networkidle");
      expect(fetched.filter((u) => u.endsWith("/html/router/prefetch")).length).toBe(1);
      expect(fetched.some((u) => u.includes("example.com"))).toBe(false);
      expect(fetched.some((u) => u.endsWith("/html/router/scroll"))).toBe(false);
      expect(fetched.some((u) => u.endsWith("/html/router/scroll-other"))).toBe(false);
      expect(fetched.some((u) => u.endsWith("/html/router/frag-source"))).toBe(false);
    });

    test("skips links below the viewport until they scroll into view", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      await page.waitForLoadState("networkidle");
      expect(fetched.some((u) => u.endsWith("/html/router/frag-target"))).toBe(false);
      await page.getByTestId("far-link").scrollIntoViewIfNeeded();
      await expect
        .poll(() => fetched.some((u) => u.endsWith("/html/router/frag-target")))
        .toBe(true);
    });

    test("drops a non-HTML response unread", async ({ page }) => {
      let requests = 0;
      await page.route("**/html/router/asset", async (route) => {
        if (route.request().resourceType() === "fetch") requests++;
        await route.fulfill({ contentType: "text/plain", body: "bytes" });
      });
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => requests).toBe(1);
      await page.waitForLoadState("networkidle");
      const loaded = page.waitForEvent("load");
      await page.getByTestId("asset-link").click();
      await loaded;
      await expect(page).toHaveURL(/\/html\/router\/asset$/);
      expect(requests).toBeGreaterThan(1);
    });

    test("skips hidden links", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      await page.waitForLoadState("networkidle");
      expect(fetched.some((u) => u.endsWith("/html/router/docs-guide"))).toBe(false);
    });

    test("uses the cached document on click without a second fetch", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      const before = fetched.filter((u) => u.endsWith("/html/router/about")).length;
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      expect(fetched.filter((u) => u.endsWith("/html/router/about")).length).toBe(before);
    });

    test("shares an in-flight document prefetch on click", async ({ page }) => {
      const fetched: string[] = [];
      await page.route("**/html/router/about", async (route) => {
        fetched.push(route.request().url());
        await new Promise((resolve) => setTimeout(resolve, 200));
        await route.continue();
      });
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.length).toBe(1);
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      expect(fetched.length).toBe(1);
    });

    test("prefetches new links after a swap", async ({ page }) => {
      const fetched = await recordFetches(page);
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect
        .poll(() => fetched.some((u) => u.endsWith("/html/router/prefetch-more")))
        .toBe(true);
      await page.getByTestId("nav-more").click();
      await expect(page.getByTestId("page-title")).toHaveText("Prefetch More");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/reference"))).toBe(true);
    });

    test("document prefetch uses `low` priority", async ({ page }) => {
      await page.addInitScript(() => {
        const original = fetch.bind(window);
        window.fetch = (input, init) => {
          const url = input instanceof Request ? input.url : String(input);
          (window.__fetchPriority ??= []).push([url, init?.priority]);
          return original(input, init);
        };
      });
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect
        .poll(() =>
          page.evaluate(() =>
            (window.__fetchPriority ?? []).some(
              ([url, priority]) => url.endsWith("/html/router/about") && priority === "low",
            ),
          ),
        )
        .toBe(true);
    });

    test("fetches documents one at a time", async ({ page }) => {
      let inFlight = 0;
      let maxInFlight = 0;
      const fetched: string[] = [];
      await page.route("**/html/router/**", async (route) => {
        if (route.request().resourceType() !== "fetch") {
          await route.continue();
          return;
        }
        fetched.push(route.request().url());
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 80));
        inFlight--;
        await route.continue();
      });
      await page.goto("/html/router/prefetch");
      await page.keyboard.press("Shift");
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/docs"))).toBe(true);
      expect(maxInFlight).toBe(1);
    });
  });

  test.describe("Concurrent navigation", () => {
    test("no-ops a click on the current URL", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        document.querySelector("[data-area='root']")?.setAttribute("data-preserved", "yes");
      });
      await page.getByTestId("nav-home").click();
      await page.waitForTimeout(80);
      expect(await page.locator("[data-area='root']").getAttribute("data-preserved")).toBe("yes");
    });

    test("drops a stale in-flight navigation when a later one arrives", async ({ page }) => {
      await page.route("**/html/router/about", async (route) => {
        await new Promise((r) => setTimeout(r, 400));
        await route.continue();
      });
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__navCount = 0;
        addEventListener("mc:navigate", () => {
          window.__navCount = (window.__navCount ?? 0) + 1;
        });
      });
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='nav-about']")?.click();
      });
      await page.waitForTimeout(50);
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='nav-docs']")?.click();
      });
      await expect(page).toHaveURL("/html/router/docs");
      await expect(page.getByTestId("page-title")).toHaveText("Docs");
      await page.waitForTimeout(500);
      await expect(page).toHaveURL("/html/router/docs");
      await expect(page.getByTestId("page-title")).toHaveText("Docs");
      const count = await page.evaluate(() => window.__navCount);
      expect(count).toBe(1);
    });
  });

  test.describe("Navigate event", () => {
    test("fires after a successful forward navigation", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__navCount = 0;
        addEventListener("mc:navigate", () => {
          window.__navCount = (window.__navCount ?? 0) + 1;
        });
      });
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      await expect(page.getByTestId("page-title")).toHaveText("About");
      const count = await page.evaluate(() => window.__navCount);
      expect(count).toBe(1);
    });
  });
});
