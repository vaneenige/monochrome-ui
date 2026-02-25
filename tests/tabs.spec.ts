import { expect, test } from "@playwright/test"

test.describe("Tabs", () => {
  test.describe("ARIA Attributes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/horizontal")
    })

    test("should have `role='tablist'` on the tab container", async ({ page }) => {
      const tablist = page.getByTestId("tab-1").locator("..")
      await expect(tablist).toHaveAttribute("role", "tablist")
    })

    test("should have `role='tab'` on each tab trigger", async ({ page }) => {
      await expect(page.getByTestId("tab-1")).toHaveAttribute("role", "tab")
      await expect(page.getByTestId("tab-2")).toHaveAttribute("role", "tab")
      await expect(page.getByTestId("tab-3")).toHaveAttribute("role", "tab")
    })

    test("should have `role='tabpanel'` on each panel", async ({ page }) => {
      await expect(page.getByTestId("panel-1")).toHaveAttribute("role", "tabpanel")
      await expect(page.getByTestId("panel-2")).toHaveAttribute("role", "tabpanel")
      await expect(page.getByTestId("panel-3")).toHaveAttribute("role", "tabpanel")
    })

    test("should have `aria-selected='true'` on the selected tab", async ({ page }) => {
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "false")
    })

    test("should have `aria-controls` on tab linking to panel", async ({ page }) => {
      const panelId = await page.getByTestId("panel-1").getAttribute("id")
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-controls", panelId as string)
    })

    test("should have `aria-labelledby` on panel linking to tab", async ({ page }) => {
      const tabId = await page.getByTestId("tab-1").getAttribute("id")
      await expect(page.getByTestId("panel-1")).toHaveAttribute("aria-labelledby", tabId as string)
    })

    test("should have correct `aria-hidden` on panels", async ({ page }) => {
      await expect(page.getByTestId("panel-1")).toHaveAttribute("aria-hidden", "false")
      await expect(page.getByTestId("panel-2")).toHaveAttribute("aria-hidden", "true")
      await expect(page.getByTestId("panel-3")).toHaveAttribute("aria-hidden", "true")
    })

    test("should have correct `tabindex` on tabs", async ({ page }) => {
      await expect(page.getByTestId("tab-1")).toHaveAttribute("tabindex", "0")
      await expect(page.getByTestId("tab-2")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("tab-3")).toHaveAttribute("tabindex", "-1")
    })

    test("should have correct `tabindex` on panels", async ({ page }) => {
      await expect(page.getByTestId("panel-1")).toHaveAttribute("tabindex", "0")
      await expect(page.getByTestId("panel-2")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("panel-3")).toHaveAttribute("tabindex", "-1")
    })

    test("should update `tabindex` when selection changes", async ({ page }) => {
      await page.getByTestId("tab-2").click()
      await expect(page.getByTestId("tab-1")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("tab-2")).toHaveAttribute("tabindex", "0")
      await expect(page.getByTestId("panel-1")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("panel-2")).toHaveAttribute("tabindex", "0")
    })

    test("should have `aria-orientation` on tablist", async ({ page }) => {
      const horizontalTablist = page.getByTestId("tab-1").locator("..")
      await expect(horizontalTablist).toHaveAttribute("aria-orientation", "horizontal")

      await page.goto("/test/tabs/vertical")
      const verticalTablist = page.getByTestId("vtab-1").locator("..")
      await expect(verticalTablist).toHaveAttribute("aria-orientation", "vertical")
    })
  })

  test.describe("Default Selection", () => {
    test("should select first tab by default when no defaultValue specified", async ({ page }) => {
      await page.goto("/test/tabs/horizontal")
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-1")).toBeVisible()
    })

    test("should select specified defaultValue tab", async ({ page }) => {
      await page.goto("/test/tabs/default-second")
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("dpanel-2")).toBeVisible()
      await expect(page.getByTestId("dtab-1")).toHaveAttribute("aria-selected", "false")
    })
  })

  test.describe("Keyboard Navigation (Horizontal)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/horizontal")
    })

    test("should move focus to next tab when `ArrowRight` is pressed", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.getByTestId("tab-1").press("ArrowRight")
      await expect(page.getByTestId("tab-2")).toBeFocused()
    })

    test("should move focus to previous tab when `ArrowLeft` is pressed", async ({ page }) => {
      await page.getByTestId("tab-2").focus()
      await page.getByTestId("tab-2").press("ArrowLeft")
      await expect(page.getByTestId("tab-1")).toBeFocused()
    })

    test("should loop to first tab when `ArrowRight` is pressed on last tab", async ({ page }) => {
      await page.getByTestId("tab-3").focus()
      await page.getByTestId("tab-3").press("ArrowRight")
      await expect(page.getByTestId("tab-1")).toBeFocused()
    })

    test("should loop to last tab when `ArrowLeft` is pressed on first tab", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.getByTestId("tab-1").press("ArrowLeft")
      await expect(page.getByTestId("tab-3")).toBeFocused()
    })

    test("should move focus to first tab when `Home` is pressed", async ({ page }) => {
      await page.getByTestId("tab-3").focus()
      await page.getByTestId("tab-3").press("Home")
      await expect(page.getByTestId("tab-1")).toBeFocused()
    })

    test("should move focus to last tab when `End` is pressed", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.getByTestId("tab-1").press("End")
      await expect(page.getByTestId("tab-3")).toBeFocused()
    })

    test("should activate tab when `Enter` is pressed", async ({ page }) => {
      await page.getByTestId("tab-2").focus()
      await page.getByTestId("tab-2").press("Enter")
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-2")).toBeVisible()
    })

    test("should activate tab when `Space` is pressed", async ({ page }) => {
      await page.getByTestId("tab-3").focus()
      await page.getByTestId("tab-3").press("Space")
      await expect(page.getByTestId("tab-3")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-3")).toBeVisible()
    })

    test("should not activate tab when arrow key moves focus", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.getByTestId("tab-1").press("ArrowRight")
      await expect(page.getByTestId("tab-2")).toBeFocused()
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "false")
      await expect(page.getByTestId("panel-1")).toBeVisible()
    })

    test("should allow `Tab` to move focus out of tablist to next element", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("panel-1")).toBeFocused()
    })

    test("should allow `Shift+Tab` to move focus out of tablist to previous element", async ({
      page,
    }) => {
      await page.getByTestId("tab-1").focus()
      await page.keyboard.press("Shift+Tab")
      await expect(page.getByTestId("focus-before")).toBeFocused()
    })

    test("should not respond to `ArrowUp` in horizontal tabs", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.getByTestId("tab-1").press("ArrowUp")
      await expect(page.getByTestId("tab-1")).toBeFocused()
    })

    test("should not respond to `ArrowDown` in horizontal tabs", async ({ page }) => {
      await page.getByTestId("tab-1").focus()
      await page.getByTestId("tab-1").press("ArrowDown")
      await expect(page.getByTestId("tab-1")).toBeFocused()
    })
  })

  test.describe("Keyboard Navigation (Vertical)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/vertical")
    })

    test("should move focus to next tab when `ArrowDown` is pressed", async ({ page }) => {
      await page.getByTestId("vtab-1").focus()
      await page.getByTestId("vtab-1").press("ArrowDown")
      await expect(page.getByTestId("vtab-2")).toBeFocused()
    })

    test("should move focus to previous tab when `ArrowUp` is pressed", async ({ page }) => {
      await page.getByTestId("vtab-2").focus()
      await page.getByTestId("vtab-2").press("ArrowUp")
      await expect(page.getByTestId("vtab-1")).toBeFocused()
    })

    test("should loop to first tab when `ArrowDown` is pressed on last tab", async ({ page }) => {
      await page.getByTestId("vtab-3").focus()
      await page.getByTestId("vtab-3").press("ArrowDown")
      await expect(page.getByTestId("vtab-1")).toBeFocused()
    })

    test("should loop to last tab when `ArrowUp` is pressed on first tab", async ({ page }) => {
      await page.getByTestId("vtab-1").focus()
      await page.getByTestId("vtab-1").press("ArrowUp")
      await expect(page.getByTestId("vtab-3")).toBeFocused()
    })

    test("should move focus to first tab when `Home` is pressed", async ({ page }) => {
      await page.getByTestId("vtab-3").focus()
      await page.getByTestId("vtab-3").press("Home")
      await expect(page.getByTestId("vtab-1")).toBeFocused()
    })

    test("should move focus to last tab when `End` is pressed", async ({ page }) => {
      await page.getByTestId("vtab-1").focus()
      await page.getByTestId("vtab-1").press("End")
      await expect(page.getByTestId("vtab-3")).toBeFocused()
    })

    test("should not respond to `ArrowLeft` in vertical tabs", async ({ page }) => {
      await page.getByTestId("vtab-1").focus()
      await page.getByTestId("vtab-1").press("ArrowLeft")
      await expect(page.getByTestId("vtab-1")).toBeFocused()
    })

    test("should not respond to `ArrowRight` in vertical tabs", async ({ page }) => {
      await page.getByTestId("vtab-1").focus()
      await page.getByTestId("vtab-1").press("ArrowRight")
      await expect(page.getByTestId("vtab-1")).toBeFocused()
    })

    test("should activate tab when `Enter` is pressed", async ({ page }) => {
      await page.getByTestId("vtab-2").focus()
      await page.getByTestId("vtab-2").press("Enter")
      await expect(page.getByTestId("vtab-2")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("vpanel-2")).toBeVisible()
    })

    test("should activate tab when `Space` is pressed", async ({ page }) => {
      await page.getByTestId("vtab-3").focus()
      await page.getByTestId("vtab-3").press("Space")
      await expect(page.getByTestId("vtab-3")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("vpanel-3")).toBeVisible()
    })

    test("should activate tab when clicked", async ({ page }) => {
      await page.getByTestId("vtab-2").click()
      await expect(page.getByTestId("vtab-2")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("vpanel-2")).toBeVisible()
      await expect(page.getByTestId("vtab-1")).toHaveAttribute("aria-selected", "false")
      await expect(page.getByTestId("vpanel-1")).not.toBeVisible()
    })
  })

  test.describe("Mouse Interaction", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/horizontal")
    })

    test("should activate tab when clicked", async ({ page }) => {
      await page.getByTestId("tab-2").click()
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-2")).toBeVisible()
    })

    test("should deselect previous tab and hide previous panel when new tab is clicked", async ({
      page,
    }) => {
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-1")).toBeVisible()
      await page.getByTestId("tab-2").click()
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "false")
      await expect(page.getByTestId("panel-1")).not.toBeVisible()
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-2")).toBeVisible()
    })

    test("should not change state when clicking already selected tab", async ({ page }) => {
      await page.getByTestId("tab-1").click()
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-1")).toBeVisible()
    })

    test("should not change state when pressing `Enter` on already selected tab", async ({
      page,
    }) => {
      await page.getByTestId("tab-1").focus()
      await page.keyboard.press("Enter")
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-1")).toBeVisible()
    })

    test("should not change state when pressing `Space` on already selected tab", async ({
      page,
    }) => {
      await page.getByTestId("tab-1").focus()
      await page.keyboard.press("Space")
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("panel-1")).toBeVisible()
    })
  })

  test.describe("Focus Management", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/horizontal")
    })

    test("should only have one tab in tab order (selected tab)", async ({ page }) => {
      await page.getByTestId("focus-before").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("tab-1")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("panel-1")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focus-after")).toBeFocused()
    })

    test("should focus selected tab when tabbing into tablist after selection change", async ({
      page,
    }) => {
      await page.getByTestId("tab-2").click()
      await page.getByTestId("focus-before").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("tab-2")).toBeFocused()
    })
  })

  test.describe("Hidden Until Found", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/horizontal")
    })

    test("should have `hidden='until-found'` on non-selected panels", async ({ page }) => {
      await expect(page.getByTestId("panel-2")).toHaveAttribute("hidden", "until-found")
      await expect(page.getByTestId("panel-3")).toHaveAttribute("hidden", "until-found")
    })

    test("should not have `hidden` on selected panel", async ({ page }) => {
      await expect(page.getByTestId("panel-1")).not.toHaveAttribute("hidden")
    })

    test("should activate tab when beforematch event is dispatched on hidden panel", async ({
      page,
    }) => {
      await page.goto("/test/tabs/search")
      const tab1 = page.getByTestId("search-tab-1")
      const tab2 = page.getByTestId("search-tab-2")
      const panel1 = page.getByTestId("search-panel-1")
      const panel2 = page.getByTestId("search-panel-2")

      await expect(tab1).toHaveAttribute("aria-selected", "true")
      await expect(tab2).toHaveAttribute("aria-selected", "false")
      await expect(panel1).toHaveAttribute("aria-hidden", "false")
      await expect(panel2).toHaveAttribute("aria-hidden", "true")

      await panel2.dispatchEvent("beforematch")

      await expect(tab2).toHaveAttribute("aria-selected", "true")
      await expect(tab1).toHaveAttribute("aria-selected", "false")
      await expect(panel2).toHaveAttribute("aria-hidden", "false")
      await expect(panel1).toHaveAttribute("aria-hidden", "true")
    })

    test("should not change selection if already selected when beforematch fires", async ({
      page,
    }) => {
      await page.goto("/test/tabs/search")
      const tab1 = page.getByTestId("search-tab-1")
      const panel1 = page.getByTestId("search-panel-1")

      await expect(tab1).toHaveAttribute("aria-selected", "true")

      await panel1.dispatchEvent("beforematch")

      await expect(tab1).toHaveAttribute("aria-selected", "true")
      await expect(panel1).toHaveAttribute("aria-hidden", "false")
    })
  })

  test.describe("SVG Inside Trigger", () => {
    test("should switch tab when clicking SVG inside trigger", async ({ page }) => {
      await page.goto("/test/tabs/svg")
      const svg = page.getByTestId("svg-icon-2")
      const panel1 = page.getByTestId("svg-panel-1")
      const panel2 = page.getByTestId("svg-panel-2")

      await expect(panel1).toBeVisible()
      await expect(panel2).not.toBeVisible()
      await svg.click()
      await expect(panel2).toBeVisible()
      await expect(panel1).not.toBeVisible()
    })
  })

  test.describe("Edge Cases", () => {
    test("should handle single tab correctly", async ({ page }) => {
      await page.goto("/test/tabs/single")
      await expect(page.getByTestId("single-tab")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("single-panel")).toBeVisible()
      await page.getByTestId("single-tab").focus()
      await page.getByTestId("single-tab").press("ArrowRight")
      await expect(page.getByTestId("single-tab")).toBeFocused()
    })
  })

  test.describe("Scroll Prevention", () => {
    test("should not scroll the page when `Space` is pressed on horizontal trigger", async ({
      page,
    }) => {
      await page.goto("/test/tabs/horizontal")
      await page.evaluate(() => {
        document.body.style.height = "3000px"
        window.scrollTo(0, 500)
      })
      await page.getByTestId("tab-1").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("Space")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })

    test("should not scroll the page when `ArrowRight` is pressed on horizontal trigger", async ({
      page,
    }) => {
      await page.goto("/test/tabs/horizontal")
      await page.evaluate(() => {
        document.body.style.width = "3000px"
        window.scrollTo(500, 0)
      })
      await page.getByTestId("tab-1").focus()
      const scrollBefore = await page.evaluate(() => window.scrollX)
      await page.keyboard.press("ArrowRight")
      const scrollAfter = await page.evaluate(() => window.scrollX)
      expect(scrollAfter).toBe(scrollBefore)
    })

    test("should not scroll the page when `ArrowDown` is pressed on vertical trigger", async ({
      page,
    }) => {
      await page.goto("/test/tabs/vertical")
      await page.evaluate(() => {
        document.body.style.height = "3000px"
        window.scrollTo(0, 500)
      })
      await page.getByTestId("vtab-1").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("ArrowDown")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })
  })

  test.describe("Disabled Tabs", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/disabled")
    })

    test("should have `aria-disabled='true'` on disabled tab", async ({ page }) => {
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-disabled", "true")
    })

    test("should not have `aria-disabled` on enabled tab", async ({ page }) => {
      await expect(page.getByTestId("dtab-1")).not.toHaveAttribute("aria-disabled")
    })

    test("should not activate disabled tab on click", async ({ page }) => {
      await page.getByTestId("dtab-2").click({ force: true })
      await expect(page.getByTestId("dtab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "false")
      await expect(page.getByTestId("dpanel-1")).toBeVisible()
    })

    test("should not activate disabled tab on `Enter`", async ({ page }) => {
      await page.getByTestId("dtab-2").focus()
      await page.getByTestId("dtab-2").press("Enter")
      await expect(page.getByTestId("dtab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "false")
    })

    test("should not activate disabled tab on `Space`", async ({ page }) => {
      await page.getByTestId("dtab-2").focus()
      await page.getByTestId("dtab-2").press("Space")
      await expect(page.getByTestId("dtab-1")).toHaveAttribute("aria-selected", "true")
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "false")
    })

    test("should skip disabled tab when navigating with `ArrowRight`", async ({ page }) => {
      await page.getByTestId("dtab-1").focus()
      await page.getByTestId("dtab-1").press("ArrowRight")
      await expect(page.getByTestId("dtab-3")).toBeFocused()
    })

    test("should skip disabled tab when navigating with `ArrowLeft`", async ({ page }) => {
      await page.getByTestId("dtab-3").focus()
      await page.getByTestId("dtab-3").press("ArrowLeft")
      await expect(page.getByTestId("dtab-1")).toBeFocused()
    })

    test("should skip disabled tab when `Home` is pressed", async ({ page }) => {
      await page.getByTestId("dtab-3").focus()
      await page.getByTestId("dtab-3").press("Home")
      await expect(page.getByTestId("dtab-1")).toBeFocused()
    })

    test("should skip disabled tab when `End` is pressed", async ({ page }) => {
      await page.getByTestId("dtab-1").focus()
      await page.getByTestId("dtab-1").press("End")
      await expect(page.getByTestId("dtab-3")).toBeFocused()
    })
  })

  test.describe("Non-Focusable Panels", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/tabs/non-focusable")
    })

    test("should not have `tabindex` on panels when `focusable={false}`", async ({ page }) => {
      await expect(page.getByTestId("nf-panel-1")).not.toHaveAttribute("tabindex")
      await expect(page.getByTestId("nf-panel-2")).not.toHaveAttribute("tabindex")
      await expect(page.getByTestId("nf-panel-3")).not.toHaveAttribute("tabindex")
    })

    test("should Tab from tab trigger to focusable content inside panel", async ({ page }) => {
      await page.getByTestId("nf-tab-1").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("nf-button-1")).toBeFocused()
    })

    test("should not add `tabindex` when switching tabs with `focusable={false}`", async ({
      page,
    }) => {
      await page.getByTestId("nf-tab-2").click()
      await expect(page.getByTestId("nf-panel-2")).not.toHaveAttribute("tabindex")
      await expect(page.getByTestId("nf-panel-1")).not.toHaveAttribute("tabindex")
    })

    test("should Tab to panel content after switching tabs", async ({ page }) => {
      await page.getByTestId("nf-tab-2").click()
      await page.getByTestId("nf-tab-2").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("nf-button-2")).toBeFocused()
    })
  })
})

test.describe("Click Handler", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test/tabs/click-handler")
  })

  test("should fire click handler on tab click", async ({ page }) => {
    await page.getByTestId("tab-2").click()
    await expect(page.getByTestId("output")).toHaveText("tab-2-clicked")
  })

  test("should fire click handler on tab `Enter`", async ({ page }) => {
    await page.getByTestId("tab-2").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("output")).toHaveText("tab-2-clicked")
  })

  test("should fire click handler on tab `Space`", async ({ page }) => {
    await page.getByTestId("tab-2").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("output")).toHaveText("tab-2-clicked")
  })
})
