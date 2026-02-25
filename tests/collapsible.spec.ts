import { expect, test } from "@playwright/test"

test.describe("Collapsible", () => {
  test.describe("ARIA Attributes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/basic")
    })

    test("should have `aria-expanded='false'` when closed", async ({ page }) => {
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "aria-expanded",
        "false",
      )
    })

    test("should have `aria-expanded='true'` when open", async ({ page }) => {
      await page.getByTestId("collapsible-trigger").click()
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute("aria-expanded", "true")
    })

    test("should have `aria-controls` on trigger linking to content", async ({ page }) => {
      const contentId = await page.getByTestId("collapsible-content").getAttribute("id")
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "aria-controls",
        contentId as string,
      )
    })

    test("should have `aria-labelledby` on content linking to trigger", async ({ page }) => {
      const triggerId = await page.getByTestId("collapsible-trigger").getAttribute("id")
      await expect(page.getByTestId("collapsible-content")).toHaveAttribute(
        "aria-labelledby",
        triggerId as string,
      )
    })

    test("should have `aria-hidden='true'` on closed content", async ({ page }) => {
      await expect(page.getByTestId("collapsible-content")).toHaveAttribute("aria-hidden", "true")
    })

    test("should have `aria-hidden='false'` on open content", async ({ page }) => {
      await page.getByTestId("collapsible-trigger").click()
      await expect(page.getByTestId("collapsible-content")).toHaveAttribute("aria-hidden", "false")
    })

    test("should not have `role='region'` on content", async ({ page }) => {
      await expect(page.getByTestId("collapsible-content")).not.toHaveAttribute("role")
    })

    test("should have `type='button'` on trigger", async ({ page }) => {
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute("type", "button")
    })
  })

  test.describe("Default State", () => {
    test("should be closed by default when `open` prop is not set", async ({ page }) => {
      await page.goto("/test/collapsible/basic")
      await expect(page.getByTestId("collapsible-content")).not.toBeVisible()
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "aria-expanded",
        "false",
      )
    })

    test("should be open by default when `open` prop is true", async ({ page }) => {
      await page.goto("/test/collapsible/open")
      await expect(page.getByTestId("open-collapsible-content")).toBeVisible()
      await expect(page.getByTestId("open-collapsible-trigger")).toHaveAttribute(
        "aria-expanded",
        "true",
      )
    })

    test("should allow closing initially open collapsible", async ({ page }) => {
      await page.goto("/test/collapsible/open")
      const trigger = page.getByTestId("open-collapsible-trigger")
      const content = page.getByTestId("open-collapsible-content")

      await expect(content).toBeVisible()
      await trigger.click()
      await expect(content).not.toBeVisible()
    })
  })

  test.describe("Keyboard Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/basic")
    })

    test("should toggle collapsible when `Enter` is pressed on trigger", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger")
      const content = page.getByTestId("collapsible-content")

      await trigger.focus()
      await expect(content).not.toBeVisible()

      await trigger.press("Enter")
      await expect(content).toBeVisible()

      await trigger.press("Enter")
      await expect(content).not.toBeVisible()
    })

    test("should toggle collapsible when `Space` is pressed on trigger", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger")
      const content = page.getByTestId("collapsible-content")

      await trigger.focus()
      await expect(content).not.toBeVisible()

      await trigger.press("Space")
      await expect(content).toBeVisible()

      await trigger.press("Space")
      await expect(content).not.toBeVisible()
    })

    test("should allow `Tab` to move focus through collapsible trigger", async ({ page }) => {
      await page.getByTestId("focus-before").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("collapsible-trigger")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focus-after")).toBeFocused()
    })

    test("should allow `Tab` into open collapsible content", async ({ page }) => {
      await page.goto("/test/collapsible/focusable")
      const trigger = page.getByTestId("focusable-trigger")

      await trigger.click()
      await expect(page.getByTestId("focusable-content")).toBeVisible()

      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focusable-input")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focusable-link")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focusable-button")).toBeFocused()
    })

    test("should skip closed collapsible content in tab order", async ({ page }) => {
      await page.goto("/test/collapsible/focusable")
      await page.getByTestId("focusable-trigger").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focusable-input")).not.toBeFocused()
    })
  })

  test.describe("Mouse Interaction", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/basic")
    })

    test("should open collapsible when trigger is clicked", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger")
      const content = page.getByTestId("collapsible-content")

      await expect(content).not.toBeVisible()
      await trigger.click()
      await expect(content).toBeVisible()
    })

    test("should close collapsible when trigger is clicked again", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger")
      const content = page.getByTestId("collapsible-content")

      await trigger.click()
      await expect(content).toBeVisible()
      await trigger.click()
      await expect(content).not.toBeVisible()
    })

    test("should not close when clicking inside content", async ({ page }) => {
      await page.goto("/test/collapsible/rich-content")
      const trigger = page.getByTestId("rich-trigger")
      const content = page.getByTestId("rich-content")
      const button = page.getByTestId("rich-content-button")

      await trigger.click()
      await expect(content).toBeVisible()

      await button.click()
      await expect(content).toBeVisible()
    })
  })

  test.describe("Focus Management", () => {
    test("should keep focus on trigger after toggling", async ({ page }) => {
      await page.goto("/test/collapsible/basic")
      const trigger = page.getByTestId("collapsible-trigger")

      await trigger.focus()
      await trigger.click()
      await expect(trigger).toBeFocused()

      await trigger.click()
      await expect(trigger).toBeFocused()
    })

    test("should allow focus into content after opening", async ({ page }) => {
      await page.goto("/test/collapsible/rich-content")
      await page.getByTestId("rich-trigger").click()
      await page.getByTestId("rich-content-button").focus()
      await expect(page.getByTestId("rich-content-button")).toBeFocused()
    })

    test("should hide content when closing collapsible that contains focused element", async ({
      page,
    }) => {
      await page.goto("/test/collapsible/focusable")
      const trigger = page.getByTestId("focusable-trigger")

      await trigger.click()
      await page.getByTestId("focusable-input").focus()
      await expect(page.getByTestId("focusable-input")).toBeFocused()

      await trigger.click()
      await expect(page.getByTestId("focusable-content")).not.toBeVisible()
    })
  })

  test.describe("Hidden Until Found", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/basic")
    })

    test("should have `hidden='until-found'` attribute when closed", async ({ page }) => {
      await expect(page.getByTestId("collapsible-content")).toHaveAttribute("hidden", "until-found")
    })

    test("should remove `hidden` attribute when open", async ({ page }) => {
      await page.getByTestId("collapsible-trigger").click()
      await expect(page.getByTestId("collapsible-content")).not.toHaveAttribute("hidden")
    })

    test("should restore `hidden='until-found'` when closed again", async ({ page }) => {
      await page.getByTestId("collapsible-trigger").click()
      await page.getByTestId("collapsible-trigger").click()
      await expect(page.getByTestId("collapsible-content")).toHaveAttribute("hidden", "until-found")
    })

    test("should open collapsible when beforematch event is dispatched on content", async ({
      page,
    }) => {
      await page.goto("/test/collapsible/search")
      const trigger = page.getByTestId("search-trigger")
      const content = page.getByTestId("search-content")

      await expect(trigger).toHaveAttribute("aria-expanded", "false")
      await expect(content).toHaveAttribute("aria-hidden", "true")

      await content.dispatchEvent("beforematch")

      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      await expect(content).toHaveAttribute("aria-hidden", "false")
    })

    test("should not close collapsible if already open when beforematch fires", async ({
      page,
    }) => {
      await page.goto("/test/collapsible/search")
      const trigger = page.getByTestId("search-trigger")
      const content = page.getByTestId("search-content")

      await trigger.click()
      await expect(trigger).toHaveAttribute("aria-expanded", "true")

      await content.dispatchEvent("beforematch")

      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      await expect(content).toHaveAttribute("aria-hidden", "false")
    })
  })

  test.describe("Arrow Key Non-Navigation", () => {
    test("should not navigate when `ArrowDown` is pressed on trigger", async ({ page }) => {
      await page.goto("/test/collapsible/multiple")
      await page.getByTestId("multi-trigger-1").focus()
      await page.getByTestId("multi-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("multi-trigger-1")).toBeFocused()
    })

    test("should not navigate when `ArrowUp` is pressed on trigger", async ({ page }) => {
      await page.goto("/test/collapsible/multiple")
      await page.getByTestId("multi-trigger-1").focus()
      await page.getByTestId("multi-trigger-1").press("ArrowUp")
      await expect(page.getByTestId("multi-trigger-1")).toBeFocused()
    })
  })

  test.describe("SVG Inside Trigger", () => {
    test("should toggle when clicking SVG inside trigger", async ({ page }) => {
      await page.goto("/test/collapsible/svg")
      const svg = page.getByTestId("svg-icon")
      const content = page.getByTestId("svg-content")

      await expect(content).not.toBeVisible()
      await svg.click()
      await expect(content).toBeVisible()
      await svg.click()
      await expect(content).not.toBeVisible()
    })
  })

  test.describe("Multiple Collapsibles", () => {
    test("should operate independently of each other", async ({ page }) => {
      await page.goto("/test/collapsible/multiple")
      const trigger1 = page.getByTestId("multi-trigger-1")
      const trigger2 = page.getByTestId("multi-trigger-2")
      const content1 = page.getByTestId("multi-content-1")
      const content2 = page.getByTestId("multi-content-2")

      await trigger1.click()
      await expect(content1).toBeVisible()
      await expect(content2).not.toBeVisible()

      await trigger2.click()
      await expect(content1).toBeVisible()
      await expect(content2).toBeVisible()

      await trigger1.click()
      await expect(content1).not.toBeVisible()
      await expect(content2).toBeVisible()
    })
  })

  test.describe("Nested Collapsibles", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/nested")
    })

    test("should allow opening outer collapsible", async ({ page }) => {
      await page.getByTestId("outer-trigger").click()
      await expect(page.getByTestId("outer-content")).toBeVisible()
    })

    test("should allow opening inner collapsible when outer is open", async ({ page }) => {
      await page.getByTestId("outer-trigger").click()
      await page.getByTestId("inner-trigger").click()
      await expect(page.getByTestId("inner-content")).toBeVisible()
    })

    test("should keep inner collapsible state when closing outer", async ({ page }) => {
      await page.getByTestId("outer-trigger").click()
      await page.getByTestId("inner-trigger").click()
      await expect(page.getByTestId("inner-content")).toBeVisible()

      await page.getByTestId("outer-trigger").click()
      await expect(page.getByTestId("outer-content")).not.toBeVisible()

      await page.getByTestId("outer-trigger").click()
      await expect(page.getByTestId("inner-content")).toBeVisible()
    })

    test("should operate inner and outer independently", async ({ page }) => {
      await page.getByTestId("outer-trigger").click()

      await page.getByTestId("inner-trigger").click()
      await expect(page.getByTestId("outer-content")).toBeVisible()
      await expect(page.getByTestId("inner-content")).toBeVisible()

      await page.getByTestId("inner-trigger").click()
      await expect(page.getByTestId("outer-content")).toBeVisible()
      await expect(page.getByTestId("inner-content")).not.toBeVisible()
    })
  })

  test.describe("Separated Trigger and Content", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/separated")
    })

    test("should toggle content that is in a different DOM subtree", async ({ page }) => {
      const trigger = page.getByTestId("separated-trigger")
      const content = page.getByTestId("separated-content")

      await expect(content).not.toBeVisible()
      await expect(trigger).toHaveAttribute("aria-expanded", "false")

      await trigger.click()
      await expect(content).toBeVisible()
      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      await expect(content).toHaveAttribute("aria-hidden", "false")

      await trigger.click()
      await expect(content).not.toBeVisible()
      await expect(trigger).toHaveAttribute("aria-expanded", "false")
      await expect(content).toHaveAttribute("aria-hidden", "true")
    })

    test("should toggle separated content via keyboard", async ({ page }) => {
      const trigger = page.getByTestId("separated-trigger")
      const content = page.getByTestId("separated-content")

      await trigger.focus()
      await trigger.press("Enter")
      await expect(content).toBeVisible()

      await trigger.press("Space")
      await expect(content).not.toBeVisible()
    })
  })

  test.describe("Scroll Prevention", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/collapsible/basic")
      await page.evaluate(() => {
        document.body.style.height = "3000px"
        window.scrollTo(0, 500)
      })
    })

    test("should not scroll the page when `Space` is pressed on trigger", async ({ page }) => {
      await page.getByTestId("collapsible-trigger").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("Space")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })
  })
})

test.describe("Click Handler", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test/collapsible/click-handler")
  })

  test("should fire click handler on trigger click", async ({ page }) => {
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked")
  })

  test("should fire click handler on trigger `Enter`", async ({ page }) => {
    await page.getByTestId("trigger").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked")
  })

  test("should fire click handler on trigger `Space`", async ({ page }) => {
    await page.getByTestId("trigger").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked")
  })
})
