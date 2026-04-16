import { expect, test } from "./fixtures"

test.describe("Router", () => {
  test.beforeEach(async ({ renderer }) => {
    test.skip(
      renderer !== "html",
      "Router is renderer-agnostic; only tested once via the html project",
    )
  })

  test.describe("Root swap", () => {
    test("should swap the root area on anchor click", async ({ page }) => {
      await page.goto("/html/router/index")
      await expect(page.getByTestId("page-title")).toHaveText("Home")
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      await expect(page.getByTestId("page-title")).toHaveText("About")
    })

    test("should update the document title", async ({ page }) => {
      await page.goto("/html/router/index")
      await expect(page).toHaveTitle("Home")
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveTitle("About")
    })

    test("should preserve the JS context across navigation", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 42
      })
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      const sentinel = await page.evaluate(
        () => (window as unknown as { __sentinel?: number }).__sentinel,
      )
      expect(sentinel).toBe(42)
    })

    test("should never replace the body or head", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        document.body.setAttribute("data-preserved-body", "yes")
        document.head.setAttribute("data-preserved-head", "yes")
      })
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      expect(await page.locator("body").getAttribute("data-preserved-body")).toBe("yes")
      expect(await page.locator("head").getAttribute("data-preserved-head")).toBe("yes")
    })

    test("should preserve siblings outside the root area", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        document.querySelector("nav")?.setAttribute("data-preserved", "yes")
      })
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      expect(await page.locator("nav").getAttribute("data-preserved")).toBe("yes")
    })

    test("should swap data-area elements in the head during a root swap", async ({ page }) => {
      await page.goto("/html/router/index")
      await expect(page.locator("meta[data-area='head-meta']")).toHaveAttribute("content", "index")
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      await expect(page.locator("meta[data-area='head-meta']")).toHaveAttribute("content", "about")
    })
  })

  test.describe("Structural mismatch", () => {
    test("should fall back to a root swap when the new page introduces new areas", async ({
      page,
    }) => {
      await page.goto("/html/router/index")
      await page.getByTestId("nav-docs").click()
      await expect(page).toHaveURL("/html/router/docs")
      await expect(page.getByTestId("page-title")).toHaveText("Docs")
      await expect(page.locator("[data-area='sidebar']")).toBeVisible()
    })

    test("should hard-reload when falling back without a root area", async ({ page }) => {
      await page.goto("/html/router/no-root")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 1
      })
      await page.evaluate(() => {
        const link = document.createElement("a")
        link.href = "/html/router/docs"
        document.body.appendChild(link)
        link.click()
      })
      await page.waitForURL("**/html/router/docs")
      const sentinel = await page.evaluate(
        () => (window as unknown as { __sentinel?: number }).__sentinel,
      )
      expect(sentinel).toBeUndefined()
    })
  })

  test.describe("Area keys", () => {
    test("should preserve an area whose key matches across pages", async ({ page }) => {
      await page.goto("/html/router/docs")
      await page.evaluate(() => {
        document.querySelector("[data-area='sidebar']")?.setAttribute("data-preserved", "yes")
      })
      await page.getByTestId("nav-docs-guide").click()
      await expect(page).toHaveURL("/html/router/docs-guide")
      await expect(page.getByTestId("page-title")).toHaveText("Docs Guide")
      expect(await page.locator("[data-area='sidebar']").getAttribute("data-preserved")).toBe("yes")
    })

    test("should swap an area whose key differs across pages", async ({ page }) => {
      await page.goto("/html/router/docs")
      await page.evaluate(() => {
        document.querySelector("[data-area='sidebar']")?.setAttribute("data-preserved", "yes")
      })
      await page.getByTestId("nav-reference").click()
      await expect(page).toHaveURL("/html/router/reference")
      expect(await page.locator("[data-area='sidebar']").getAttribute("data-preserved")).toBeNull()
    })
  })

  test.describe("Anchor filtering", () => {
    test("should not intercept modifier-clicked links", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.getByTestId("nav-about").click({ modifiers: ["ControlOrMeta"] })
      await expect(page).toHaveURL("/html/router/index")
      await expect(page.getByTestId("page-title")).toHaveText("Home")
    })

    test("should not intercept target=_blank links", async ({ page, context }) => {
      await page.goto("/html/router/ignored")
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.getByTestId("blank-link").click(),
      ])
      await newPage.waitForLoadState()
      await expect(page).toHaveURL("/html/router/ignored")
      await newPage.close()
    })

    test("should not intercept download links", async ({ page }) => {
      await page.goto("/html/router/ignored")
      await page.evaluate(() => {
        document
          .querySelector<HTMLAnchorElement>("[data-testid='download-link']")
          ?.addEventListener("click", (e) => e.preventDefault(), { once: true })
      })
      await page.getByTestId("download-link").click()
      await page.waitForTimeout(80)
      await expect(page).toHaveURL("/html/router/ignored")
      await expect(page.getByTestId("page-marker")).toHaveText("ignored")
    })

    test("should not intercept cross-origin links", async ({ page }) => {
      await page.goto("/html/router/ignored")
      await page.evaluate(() => {
        document
          .querySelector<HTMLAnchorElement>("[data-testid='external-link']")
          ?.addEventListener("click", (e) => e.preventDefault(), { once: true })
      })
      await page.getByTestId("external-link").click()
      await page.waitForTimeout(80)
      await expect(page).toHaveURL("/html/router/ignored")
      await expect(page.getByTestId("page-marker")).toHaveText("ignored")
    })

    test("should not intercept rel=external links", async ({ page }) => {
      await page.goto("/html/router/ignored")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 1
      })
      await page.getByTestId("rel-external-link").click()
      await expect(page).toHaveURL("/html/router/no-root")
      const sentinel = await page.evaluate(
        () => (window as unknown as { __sentinel?: number }).__sentinel,
      )
      expect(sentinel).toBeUndefined()
    })

    test("should not intercept same-page hash links", async ({ page }) => {
      await page.goto("/html/router/ignored")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 1
      })
      await page.getByTestId("hash-link").click()
      await expect(page).toHaveURL("/html/router/ignored#anchor")
      const sentinel = await page.evaluate(
        () => (window as unknown as { __sentinel?: number }).__sentinel,
      )
      expect(sentinel).toBe(1)
    })
  })

  test.describe("History", () => {
    test("should handle back navigation via popstate", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.getByTestId("nav-about").click()
      await expect(page.getByTestId("page-title")).toHaveText("About")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 99
      })
      await page.goBack()
      await expect(page).toHaveURL("/html/router/index")
      await expect(page.getByTestId("page-title")).toHaveText("Home")
      const sentinel = await page.evaluate(
        () => (window as unknown as { __sentinel?: number }).__sentinel,
      )
      expect(sentinel).toBe(99)
    })

    test("should restore scroll position on back navigation", async ({ page }) => {
      await page.goto("/html/router/scroll")
      await page.evaluate(() => window.scrollTo(0, 600))
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600)
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='link-next']")?.click()
      })
      await expect(page).toHaveURL("/html/router/scroll-other")
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
      await page.goBack()
      await expect(page).toHaveURL("/html/router/scroll")
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600)
    })
  })

  test.describe("Fallback", () => {
    test("should fall back to real navigation when fetch returns 404", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 1
      })
      await page.getByTestId("nav-missing").click()
      await page.waitForURL("**/html/router/does-not-exist")
      const sentinel = await page.evaluate(
        () => (window as unknown as { __sentinel?: number }).__sentinel,
      )
      expect(sentinel).toBeUndefined()
    })
  })

  test.describe("Redirects", () => {
    test("should follow a same-origin redirect and land on the final URL", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.getByTestId("nav-redirect").click()
      await expect(page).toHaveURL("/html/router/about")
      await expect(page.getByTestId("page-title")).toHaveText("About")
    })

    test("should fall back to real navigation on a cross-origin redirect", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __sentinel: number }).__sentinel = 1
      })
      const navigated = page.waitForEvent("framenavigated", { timeout: 3000 }).catch(() => null)
      await page.getByTestId("nav-redirect-ext").click()
      await navigated
      const url = page.url()
      expect(url).not.toContain("/html/router/about")
    })
  })

  test.describe("Prefetching", () => {
    test("should not prefetch before any user interaction", async ({ page }) => {
      await page.goto("/html/router/index")
      const fetched = await page.evaluate(async () => {
        const record: string[] = []
        const orig = window.fetch
        window.fetch = (input, init) => {
          const url = typeof input === "string" ? input : (input as Request).url
          record.push(url)
          return orig(input, init)
        }
        await new Promise((r) => setTimeout(r, 100))
        return record
      })
      expect(fetched.length).toBe(0)
    })

    test("should prefetch a link on hover", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __fetched: string[] }).__fetched = []
        const orig = window.fetch
        window.fetch = (input, init) => {
          const url = typeof input === "string" ? input : (input as Request).url
          ;(window as unknown as { __fetched: string[] }).__fetched.push(url)
          return orig(input, init)
        }
      })
      await page.getByTestId("nav-about").hover()
      await expect
        .poll(async () =>
          (
            await page.evaluate(() => (window as unknown as { __fetched: string[] }).__fetched)
          ).some((u) => u.endsWith("/html/router/about")),
        )
        .toBe(true)
    })

    test("should prefetch a link on keyboard focus", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __fetched: string[] }).__fetched = []
        const orig = window.fetch
        window.fetch = (input, init) => {
          const url = typeof input === "string" ? input : (input as Request).url
          ;(window as unknown as { __fetched: string[] }).__fetched.push(url)
          return orig(input, init)
        }
      })
      await page.getByTestId("nav-about").focus()
      await expect
        .poll(async () =>
          (
            await page.evaluate(() => (window as unknown as { __fetched: string[] }).__fetched)
          ).some((u) => u.endsWith("/html/router/about")),
        )
        .toBe(true)
    })

    test("should use cached html on navigation after hover", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __fetched: string[] }).__fetched = []
        const orig = window.fetch
        window.fetch = (input, init) => {
          const url = typeof input === "string" ? input : (input as Request).url
          ;(window as unknown as { __fetched: string[] }).__fetched.push(url)
          return orig(input, init)
        }
      })
      await page.getByTestId("nav-about").hover()
      await expect
        .poll(async () =>
          (
            await page.evaluate(() => (window as unknown as { __fetched: string[] }).__fetched)
          ).some((u) => u.endsWith("/html/router/about")),
        )
        .toBe(true)
      const before = await page.evaluate(
        () => (window as unknown as { __fetched: string[] }).__fetched.length,
      )
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      const after = await page.evaluate(
        () => (window as unknown as { __fetched: string[] }).__fetched.length,
      )
      expect(after).toBe(before)
    })
  })

  test.describe("Concurrent navigation", () => {
    test("should no-op a click on the current URL", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        document.querySelector("[data-area='root']")?.setAttribute("data-preserved", "yes")
      })
      await page.getByTestId("nav-home").click()
      await page.waitForTimeout(80)
      expect(await page.locator("[data-area='root']").getAttribute("data-preserved")).toBe("yes")
    })

    test("should drop a stale in-flight navigation when a later one arrives", async ({ page }) => {
      await page.route("**/html/router/about", async (route) => {
        await new Promise((r) => setTimeout(r, 400))
        await route.continue()
      })
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __navCount: number }).__navCount = 0
        addEventListener("mc:navigate", () => {
          ;(window as unknown as { __navCount: number }).__navCount++
        })
      })
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='nav-about']")?.click()
      })
      await page.waitForTimeout(50)
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("[data-testid='nav-docs']")?.click()
      })
      await expect(page).toHaveURL("/html/router/docs")
      await expect(page.getByTestId("page-title")).toHaveText("Docs")
      await page.waitForTimeout(500)
      await expect(page).toHaveURL("/html/router/docs")
      await expect(page.getByTestId("page-title")).toHaveText("Docs")
      const count = await page.evaluate(
        () => (window as unknown as { __navCount: number }).__navCount,
      )
      expect(count).toBe(1)
    })
  })

  test.describe("navigate event", () => {
    test("should fire after a successful forward navigation", async ({ page }) => {
      await page.goto("/html/router/index")
      await page.evaluate(() => {
        ;(window as unknown as { __navCount: number }).__navCount = 0
        addEventListener("mc:navigate", () => {
          ;(window as unknown as { __navCount: number }).__navCount++
        })
      })
      await page.getByTestId("nav-about").click()
      await expect(page).toHaveURL("/html/router/about")
      const count = await page.evaluate(
        () => (window as unknown as { __navCount: number }).__navCount,
      )
      expect(count).toBe(1)
    })
  })
})
