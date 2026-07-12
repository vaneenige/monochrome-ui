import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.describe("Router", () => {
  test.beforeEach(async ({ renderer }) => {
    test.skip(
      renderer !== "html",
      "Router is renderer-agnostic; only tested once via the html project",
    );
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
      expect(await page.locator("[data-area='sidebar']").getAttribute("data-preserved")).toBeNull();
    });
  });

  test.describe("Anchor filtering", () => {
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
    test("takes ownership of scroll restoration", async ({ page }) => {
      await page.goto("/html/router/index");
      const mode = await page.evaluate(() => history.scrollRestoration);
      expect(mode).toBe("manual");
    });

    test("handles back navigation via `popstate`", async ({ page }) => {
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
  });

  test.describe("Fallback", () => {
    test("falls back to real navigation when fetch returns 404", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.evaluate(() => {
        window.__sentinel = 1;
      });
      await page.getByTestId("nav-missing").click();
      await page.waitForURL("**/html/router/does-not-exist");
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
  });

  test.describe("Prefetching", () => {
    const recordFetches = async (page: Page) => {
      const urls: string[] = [];
      await page.route("**/*", (route) => {
        urls.push(route.request().url());
        void route.continue();
      });
      return urls;
    };

    test("does not prefetch before any user interaction", async ({ page }) => {
      await page.goto("/html/router/index");
      await page.waitForLoadState("networkidle");
      const fetched = await recordFetches(page);
      await page.waitForTimeout(100);
      expect(fetched).toHaveLength(0);
    });

    test("prefetches a link on hover", async ({ page }) => {
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").hover();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
    });

    test("prefetches a link on keyboard focus", async ({ page }) => {
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").focus();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
    });

    test("uses cached HTML on navigation after hover", async ({ page }) => {
      await page.goto("/html/router/index");
      const fetched = await recordFetches(page);
      await page.getByTestId("nav-about").hover();
      await expect.poll(() => fetched.some((u) => u.endsWith("/html/router/about"))).toBe(true);
      const before = fetched.length;
      await page.getByTestId("nav-about").click();
      await expect(page).toHaveURL("/html/router/about");
      expect(fetched).toHaveLength(before);
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
      const count = await page.evaluate(() => window.__navCount);
      expect(count).toBe(1);
    });
  });
});
