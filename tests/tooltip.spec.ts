import { expect, test } from "./fixtures"

test.describe("Tooltip", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/tooltip/basic`)
  })

  test.describe("ARIA Attributes", () => {
    test("should have `role='tooltip'` on content", async ({ page }) => {
      await expect(page.getByTestId("tooltip-content")).toHaveAttribute("role", "tooltip")
    })

    test("should have `aria-describedby` on trigger matching content id", async ({ page }) => {
      const describedBy = await page.getByTestId("tooltip-trigger").getAttribute("aria-describedby")
      const contentId = await page.getByTestId("tooltip-content").getAttribute("id")
      expect(describedBy).toBe(contentId)
    })

    test("should have `popover='manual'` on content", async ({ page }) => {
      await expect(page.getByTestId("tooltip-content")).toHaveAttribute("popover", "manual")
    })

    test("should have `type='button'` on trigger", async ({ page }) => {
      await expect(page.getByTestId("tooltip-trigger")).toHaveAttribute("type", "button")
    })

    test("should not have `aria-expanded` on trigger", async ({ page }) => {
      await expect(page.getByTestId("tooltip-trigger")).not.toHaveAttribute("aria-expanded", /.*/)
    })

    test("should not have `aria-controls` on trigger", async ({ page }) => {
      await expect(page.getByTestId("tooltip-trigger")).not.toHaveAttribute("aria-controls", /.*/)
    })

    test("should keep `aria-describedby` when tooltip is hidden", async ({ page }) => {
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
      await expect(page.getByTestId("tooltip-trigger")).toHaveAttribute("aria-describedby", /.+/)
    })
  })

  test.describe("Hover Behavior", () => {
    test("should show on hover", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
    })

    test("should hide when hover leaves", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.getByTestId("focus-before").hover()
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
    })

    test("should switch when hover moves to another tooltip trigger", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.getByTestId("second-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
      await expect(page.getByTestId("second-content")).toBeVisible()
    })
  })

  test.describe("Focus Behavior", () => {
    test("should show on focus", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
    })

    test("should hide on blur", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.getByTestId("focus-before").focus()
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
    })

    test("should show when tabbing onto a trigger", async ({ page }) => {
      await page.getByTestId("focus-before").focus()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("tooltip-trigger")).toBeFocused()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
    })

    test("should not move focus when shown", async ({ page }) => {
      await page.getByTestId("focus-before").focus()
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await expect(page.getByTestId("focus-before")).toBeFocused()
    })
  })

  test.describe("Mixed hover + focus", () => {
    test("hover shows B's tooltip while focus is on A", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.getByTestId("second-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
      await expect(page.getByTestId("second-content")).toBeVisible()
    })

    test("unhover falls back to focused trigger's tooltip", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus()
      await page.getByTestId("second-trigger").hover()
      await expect(page.getByTestId("second-content")).toBeVisible()
      await page.getByTestId("focus-between").hover()
      await expect(page.getByTestId("second-content")).not.toBeVisible()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
    })
  })

  test.describe("Dismissal by press", () => {
    test("should hide on trigger click", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.getByTestId("tooltip-trigger").click()
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
    })

    test("should hide on Escape without moving focus", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
      await expect(page.getByTestId("tooltip-trigger")).toBeFocused()
    })

    test("should stay suppressed until focus leaves and returns", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus()
      await page.keyboard.press("Escape")
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
      await page.getByTestId("focus-before").focus()
      await page.getByTestId("tooltip-trigger").focus()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
    })
  })

  test.describe("Disabled", () => {
    test("should still show tooltip when trigger is aria-disabled", async ({ page }) => {
      await page.getByTestId("disabled-trigger").hover()
      await expect(page.getByTestId("disabled-content")).toBeVisible()
    })
  })

  test.describe("Dismissal", () => {
    test("should hide on scroll", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 300 })
      await page.evaluate(() => {
        const div = document.createElement("div")
        div.style.height = "2000px"
        document.body.appendChild(div)
      })
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
      await page.evaluate(() => window.scrollTo(0, 200))
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible()
    })
  })

  test.describe("Interaction with other components", () => {
    test("should not block popover trigger click", async ({ page }) => {
      await page.getByTestId("popover-trigger").click()
      await expect(page.getByTestId("popover-content")).toBeVisible()
    })

    test("should not block menu trigger click", async ({ page }) => {
      await page.getByTestId("menu-trigger").click()
      await expect(page.getByTestId("menu-list")).toBeVisible()
    })

    test("clicking another (non-tooltip) trigger does not suppress future tooltips", async ({
      page,
    }) => {
      await page.getByTestId("popover-trigger").click()
      await page.keyboard.press("Escape")
      await page.getByTestId("tooltip-trigger").hover()
      await expect(page.getByTestId("tooltip-content")).toBeVisible()
    })
  })
})
