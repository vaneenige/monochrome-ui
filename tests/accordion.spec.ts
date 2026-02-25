import { expect, test } from "@playwright/test"

test.describe("Accordion", () => {
  test.describe("ARIA Attributes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/single")
    })

    test("should have `aria-expanded='false'` on closed item trigger", async ({ page }) => {
      await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "false")
    })

    test("should have `aria-expanded='true'` on open item trigger", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click()
      await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "true")
    })

    test("should have `aria-controls` on trigger linking to content", async ({ page }) => {
      const contentId = await page.getByTestId("single-content-1").getAttribute("id")
      await expect(page.getByTestId("single-trigger-1")).toHaveAttribute(
        "aria-controls",
        contentId as string,
      )
    })

    test("should have `aria-labelledby` on content linking to trigger", async ({ page }) => {
      const triggerId = await page.getByTestId("single-trigger-1").getAttribute("id")
      await expect(page.getByTestId("single-content-1")).toHaveAttribute(
        "aria-labelledby",
        triggerId as string,
      )
    })

    test("should have `aria-hidden='true'` on closed content", async ({ page }) => {
      await expect(page.getByTestId("single-content-1")).toHaveAttribute("aria-hidden", "true")
    })

    test("should have `aria-hidden='false'` on open content", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click()
      await expect(page.getByTestId("single-content-1")).toHaveAttribute("aria-hidden", "false")
    })

    test("should have `role='region'` on content", async ({ page }) => {
      await expect(page.getByTestId("single-content-1")).toHaveAttribute("role", "region")
    })

    test("should have `type='button'` on trigger", async ({ page }) => {
      await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("type", "button")
    })

    test("should have trigger wrapped in heading element (default h3)", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1")
      const parent = trigger.locator("..")
      const tagName = await parent.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe("h3")
    })

    test("should support custom heading level via `as` prop", async ({ page }) => {
      await page.goto("/test/accordion/heading")
      const trigger = page.getByTestId("heading-trigger-1")
      const parent = trigger.locator("..")
      const tagName = await parent.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe("h2")
    })

    test("should have `data-mode='single'` on single-mode accordion", async ({ page }) => {
      const singleAccordion = page.getByTestId("single-trigger-1").locator("../../..")
      await expect(singleAccordion).toHaveAttribute("data-mode", "single")
    })

    test("should have `data-mode='multiple'` on multiple-mode accordion", async ({ page }) => {
      await page.goto("/test/accordion/multiple")
      const multiAccordion = page.getByTestId("multi-trigger-1").locator("../../..")
      await expect(multiAccordion).toHaveAttribute("data-mode", "multiple")
    })
  })

  test.describe("Default State", () => {
    test("should be closed by default when `open` prop is not set", async ({ page }) => {
      await page.goto("/test/accordion/single")
      await expect(page.getByTestId("single-content-1")).not.toBeVisible()
      await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "false")
    })

    test("should be open by default when `open` prop is true", async ({ page }) => {
      await page.goto("/test/accordion/default-open")
      await expect(page.getByTestId("default-content-2")).toBeVisible()
      await expect(page.getByTestId("default-trigger-2")).toHaveAttribute("aria-expanded", "true")
    })

    test("should allow closing initially open item", async ({ page }) => {
      await page.goto("/test/accordion/default-open")
      await expect(page.getByTestId("default-content-2")).toBeVisible()
      await page.getByTestId("default-trigger-2").click()
      await expect(page.getByTestId("default-content-2")).not.toBeVisible()
    })
  })

  test.describe("Keyboard Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/single")
    })

    test("should move focus to next item when `ArrowDown` is pressed", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus()
      await page.getByTestId("single-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("single-trigger-2")).toBeFocused()
    })

    test("should move focus to previous item when `ArrowUp` is pressed", async ({ page }) => {
      await page.getByTestId("single-trigger-2").focus()
      await page.getByTestId("single-trigger-2").press("ArrowUp")
      await expect(page.getByTestId("single-trigger-1")).toBeFocused()
    })

    test("should loop to first item when `ArrowDown` is pressed on last item", async ({ page }) => {
      await page.getByTestId("single-trigger-3").focus()
      await page.getByTestId("single-trigger-3").press("ArrowDown")
      await expect(page.getByTestId("single-trigger-1")).toBeFocused()
    })

    test("should loop to last item when `ArrowUp` is pressed on first item", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus()
      await page.getByTestId("single-trigger-1").press("ArrowUp")
      await expect(page.getByTestId("single-trigger-3")).toBeFocused()
    })

    test("should move focus to first item when `Home` is pressed", async ({ page }) => {
      await page.getByTestId("single-trigger-3").focus()
      await page.getByTestId("single-trigger-3").press("Home")
      await expect(page.getByTestId("single-trigger-1")).toBeFocused()
    })

    test("should move focus to last item when `End` is pressed", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus()
      await page.getByTestId("single-trigger-1").press("End")
      await expect(page.getByTestId("single-trigger-3")).toBeFocused()
    })

    test("should toggle item when `Enter` is pressed on trigger", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1")
      const content = page.getByTestId("single-content-1")

      await trigger.focus()
      await expect(content).not.toBeVisible()

      await trigger.press("Enter")
      await expect(content).toBeVisible()

      await trigger.press("Enter")
      await expect(content).not.toBeVisible()
    })

    test("should toggle item when `Space` is pressed on trigger", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1")
      const content = page.getByTestId("single-content-1")

      await trigger.focus()
      await expect(content).not.toBeVisible()

      await trigger.press("Space")
      await expect(content).toBeVisible()

      await trigger.press("Space")
      await expect(content).not.toBeVisible()
    })

    test("should allow `Tab` to move through accordion triggers", async ({ page }) => {
      await page.getByTestId("focus-before").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("single-trigger-1")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("single-trigger-2")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("single-trigger-3")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("focus-after")).toBeFocused()
    })

    test("should allow `Tab` into open accordion content", async ({ page }) => {
      await page.goto("/test/accordion/rich-content")
      await page.getByTestId("rich-trigger-1").click()
      await expect(page.getByTestId("rich-content-1")).toBeVisible()

      await page.getByTestId("rich-trigger-1").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("rich-input")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("rich-button")).toBeFocused()
    })

    test("should navigate with arrows regardless of open state", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click()
      await page.getByTestId("single-trigger-1").focus()
      await page.getByTestId("single-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("single-trigger-2")).toBeFocused()
    })

    test("should not respond to `ArrowLeft` on trigger", async ({ page }) => {
      await page.getByTestId("single-trigger-2").focus()
      await page.getByTestId("single-trigger-2").press("ArrowLeft")
      await expect(page.getByTestId("single-trigger-2")).toBeFocused()
    })

    test("should not respond to `ArrowRight` on trigger", async ({ page }) => {
      await page.getByTestId("single-trigger-2").focus()
      await page.getByTestId("single-trigger-2").press("ArrowRight")
      await expect(page.getByTestId("single-trigger-2")).toBeFocused()
    })
  })

  test.describe("Mouse Interaction", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/single")
    })

    test("should open item when trigger is clicked", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1")
      const content = page.getByTestId("single-content-1")

      await expect(content).not.toBeVisible()
      await trigger.click()
      await expect(content).toBeVisible()
    })

    test("should close item when trigger is clicked again", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1")
      const content = page.getByTestId("single-content-1")

      await trigger.click()
      await expect(content).toBeVisible()
      await trigger.click()
      await expect(content).not.toBeVisible()
    })

    test("should not close when clicking inside content", async ({ page }) => {
      await page.goto("/test/accordion/rich-content")
      await page.getByTestId("rich-trigger-1").click()
      await expect(page.getByTestId("rich-content-1")).toBeVisible()

      await page.getByTestId("rich-button").click()
      await expect(page.getByTestId("rich-content-1")).toBeVisible()
    })
  })

  test.describe("Focus Management", () => {
    test("should keep focus on trigger after toggling", async ({ page }) => {
      await page.goto("/test/accordion/single")
      const trigger = page.getByTestId("single-trigger-1")

      await trigger.focus()
      await trigger.click()
      await expect(trigger).toBeFocused()

      await trigger.click()
      await expect(trigger).toBeFocused()
    })
  })

  test.describe("Hidden Until Found", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/single")
    })

    test("should have `hidden='until-found'` attribute on closed content", async ({ page }) => {
      await expect(page.getByTestId("single-content-1")).toHaveAttribute("hidden", "until-found")
    })

    test("should remove `hidden` attribute when open", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click()
      await expect(page.getByTestId("single-content-1")).not.toHaveAttribute("hidden")
    })

    test("should restore `hidden='until-found'` when closed again", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click()
      await page.getByTestId("single-trigger-1").click()
      await expect(page.getByTestId("single-content-1")).toHaveAttribute("hidden", "until-found")
    })

    test("should open accordion item when beforematch event is dispatched on content", async ({
      page,
    }) => {
      await page.goto("/test/accordion/search")
      const trigger = page.getByTestId("search-trigger-2")
      const content = page.getByTestId("search-content-2")

      await expect(trigger).toHaveAttribute("aria-expanded", "false")
      await expect(content).toHaveAttribute("aria-hidden", "true")

      await content.dispatchEvent("beforematch")

      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      await expect(content).toHaveAttribute("aria-hidden", "false")
    })

    test("should close other items in single mode when beforematch opens an item", async ({
      page,
    }) => {
      await page.goto("/test/accordion/search")
      const trigger1 = page.getByTestId("search-trigger-1")
      const content1 = page.getByTestId("search-content-1")
      const trigger2 = page.getByTestId("search-trigger-2")
      const content2 = page.getByTestId("search-content-2")

      await trigger1.click()
      await expect(trigger1).toHaveAttribute("aria-expanded", "true")
      await expect(content1).toHaveAttribute("aria-hidden", "false")

      await content2.dispatchEvent("beforematch")

      await expect(trigger2).toHaveAttribute("aria-expanded", "true")
      await expect(content2).toHaveAttribute("aria-hidden", "false")
      await expect(trigger1).toHaveAttribute("aria-expanded", "false")
      await expect(content1).toHaveAttribute("aria-hidden", "true")
    })

    test("should not change state if already open when beforematch fires", async ({ page }) => {
      await page.goto("/test/accordion/search")
      const trigger = page.getByTestId("search-trigger-2")
      const content = page.getByTestId("search-content-2")

      await trigger.click()
      await expect(trigger).toHaveAttribute("aria-expanded", "true")

      await content.dispatchEvent("beforematch")

      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      await expect(content).toHaveAttribute("aria-hidden", "false")
    })
  })

  test.describe("Single Mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/single")
    })

    test("should close other items when opening a new one", async ({ page }) => {
      const trigger1 = page.getByTestId("single-trigger-1")
      const trigger2 = page.getByTestId("single-trigger-2")
      const content1 = page.getByTestId("single-content-1")
      const content2 = page.getByTestId("single-content-2")

      await trigger1.click()
      await expect(content1).toBeVisible()
      await expect(content2).not.toBeVisible()

      await trigger2.click()
      await expect(content1).not.toBeVisible()
      await expect(content2).toBeVisible()
    })

    test("should close other items when opening a new one via keyboard", async ({ page }) => {
      const trigger1 = page.getByTestId("single-trigger-1")
      const trigger2 = page.getByTestId("single-trigger-2")
      const content1 = page.getByTestId("single-content-1")
      const content2 = page.getByTestId("single-content-2")

      await trigger1.focus()
      await trigger1.press("Enter")
      await expect(content1).toBeVisible()

      await trigger1.press("ArrowDown")
      await expect(trigger2).toBeFocused()
      await trigger2.press("Enter")
      await expect(content2).toBeVisible()
      await expect(content1).not.toBeVisible()
    })

    test("should allow closing all items", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1")
      const content = page.getByTestId("single-content-1")

      await trigger.click()
      await expect(content).toBeVisible()

      await trigger.click()
      await expect(content).not.toBeVisible()

      await expect(page.getByTestId("single-content-1")).not.toBeVisible()
      await expect(page.getByTestId("single-content-2")).not.toBeVisible()
      await expect(page.getByTestId("single-content-3")).not.toBeVisible()
    })
  })

  test.describe("Multiple Mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/multiple")
    })

    test("should allow multiple items to be open", async ({ page }) => {
      await page.getByTestId("multi-trigger-1").click()
      await page.getByTestId("multi-trigger-2").click()

      await expect(page.getByTestId("multi-content-1")).toBeVisible()
      await expect(page.getByTestId("multi-content-2")).toBeVisible()
    })

    test("should allow closing items independently", async ({ page }) => {
      await page.getByTestId("multi-trigger-1").click()
      await page.getByTestId("multi-trigger-2").click()
      await page.getByTestId("multi-trigger-3").click()

      await page.getByTestId("multi-trigger-2").click()

      await expect(page.getByTestId("multi-content-1")).toBeVisible()
      await expect(page.getByTestId("multi-content-2")).not.toBeVisible()
      await expect(page.getByTestId("multi-content-3")).toBeVisible()
    })

    test("should navigate with keyboard across items in multiple mode", async ({ page }) => {
      await page.getByTestId("multi-trigger-1").focus()
      await page.getByTestId("multi-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("multi-trigger-2")).toBeFocused()
      await page.getByTestId("multi-trigger-2").press("ArrowDown")
      await expect(page.getByTestId("multi-trigger-3")).toBeFocused()
    })
  })

  test.describe("Nested Accordions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/nested")
    })

    test("should allow opening outer accordion", async ({ page }) => {
      await page.getByTestId("outer-trigger-1").click()
      await expect(page.getByTestId("outer-content-1")).toBeVisible()
    })

    test("should allow opening inner accordion when outer is open", async ({ page }) => {
      await page.getByTestId("outer-trigger-1").click()
      await page.getByTestId("nested-trigger-1").click()
      await expect(page.getByTestId("nested-content-1")).toBeVisible()
    })

    test("should keep inner accordion state independent of outer", async ({ page }) => {
      await page.getByTestId("outer-trigger-1").click()
      await page.getByTestId("nested-trigger-1").click()

      await page.getByTestId("outer-trigger-1").click()
      await expect(page.getByTestId("outer-content-1")).not.toBeVisible()

      await page.getByTestId("outer-trigger-1").click()
      await expect(page.getByTestId("nested-content-1")).toBeVisible()
    })

    test("should navigate within nested accordion independently", async ({ page }) => {
      await page.getByTestId("outer-trigger-1").click()
      await page.getByTestId("nested-trigger-1").focus()

      await page.getByTestId("nested-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("nested-trigger-2")).toBeFocused()

      await page.getByTestId("nested-trigger-2").press("ArrowUp")
      await expect(page.getByTestId("nested-trigger-1")).toBeFocused()
    })
  })

  test.describe("SVG Inside Trigger", () => {
    test("should toggle when clicking SVG inside trigger", async ({ page }) => {
      await page.goto("/test/accordion/svg")
      const svg = page.getByTestId("svg-icon-1")
      const content = page.getByTestId("svg-content-1")

      await expect(content).not.toBeVisible()
      await svg.click()
      await expect(content).toBeVisible()
      await svg.click()
      await expect(content).not.toBeVisible()
    })
  })

  test.describe("Edge Cases", () => {
    test("should handle single item accordion", async ({ page }) => {
      await page.goto("/test/accordion/single-item")
      const trigger = page.getByTestId("only-trigger")
      const content = page.getByTestId("only-content")

      await trigger.click()
      await expect(content).toBeVisible()
      await trigger.click()
      await expect(content).not.toBeVisible()

      await trigger.focus()
      await trigger.press("ArrowDown")
      await expect(trigger).toBeFocused()
      await trigger.press("ArrowUp")
      await expect(trigger).toBeFocused()
    })
  })

  test.describe("Scroll Prevention", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/single")
      await page.evaluate(() => {
        document.body.style.height = "3000px"
        window.scrollTo(0, 500)
      })
    })

    test("should not scroll the page when `Space` is pressed on trigger", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("Space")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })

    test("should not scroll the page when `ArrowDown` is pressed on trigger", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("ArrowDown")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })
  })

  test.describe("Disabled Items", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/test/accordion/disabled")
    })

    test("should have `aria-disabled='true'` on disabled item trigger", async ({ page }) => {
      await expect(page.getByTestId("disabled-trigger-2")).toHaveAttribute("aria-disabled", "true")
    })

    test("should not have `aria-disabled` on enabled item trigger", async ({ page }) => {
      await expect(page.getByTestId("disabled-trigger-1")).not.toHaveAttribute("aria-disabled")
    })

    test("should not toggle disabled item on click", async ({ page }) => {
      await page.getByTestId("disabled-trigger-2").click({ force: true })
      await expect(page.getByTestId("disabled-content-2")).not.toBeVisible()
      await expect(page.getByTestId("disabled-trigger-2")).toHaveAttribute("aria-expanded", "false")
    })

    test("should not toggle disabled item on `Enter`", async ({ page }) => {
      await page.getByTestId("disabled-trigger-2").focus()
      await page.getByTestId("disabled-trigger-2").press("Enter")
      await expect(page.getByTestId("disabled-content-2")).not.toBeVisible()
    })

    test("should not toggle disabled item on `Space`", async ({ page }) => {
      await page.getByTestId("disabled-trigger-2").focus()
      await page.getByTestId("disabled-trigger-2").press("Space")
      await expect(page.getByTestId("disabled-content-2")).not.toBeVisible()
    })

    test("should skip disabled item when navigating with `ArrowDown`", async ({ page }) => {
      await page.getByTestId("disabled-trigger-1").focus()
      await page.getByTestId("disabled-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("disabled-trigger-3")).toBeFocused()
    })

    test("should skip disabled item when navigating with `ArrowUp`", async ({ page }) => {
      await page.getByTestId("disabled-trigger-3").focus()
      await page.getByTestId("disabled-trigger-3").press("ArrowUp")
      await expect(page.getByTestId("disabled-trigger-1")).toBeFocused()
    })

    test("should skip disabled item when `Home` is pressed", async ({ page }) => {
      await page.getByTestId("disabled-trigger-3").focus()
      await page.getByTestId("disabled-trigger-3").press("Home")
      await expect(page.getByTestId("disabled-trigger-1")).toBeFocused()
    })

    test("should skip disabled item when `End` is pressed", async ({ page }) => {
      await page.getByTestId("disabled-trigger-1").focus()
      await page.getByTestId("disabled-trigger-1").press("End")
      await expect(page.getByTestId("disabled-trigger-3")).toBeFocused()
    })

    test("should allow enabled items to toggle in single mode with disabled item", async ({
      page,
    }) => {
      await page.getByTestId("disabled-trigger-1").click()
      await expect(page.getByTestId("disabled-content-1")).toBeVisible()

      await page.getByTestId("disabled-trigger-3").click()
      await expect(page.getByTestId("disabled-content-3")).toBeVisible()
      await expect(page.getByTestId("disabled-content-1")).not.toBeVisible()
    })
  })
})

test.describe("Click Handler", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test/accordion/click-handler")
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
