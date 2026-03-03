import { expect, test } from "./fixtures"

test.describe("Dropdown", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/dropdown`)
  })

  test.describe("ARIA Attributes", () => {
    test("should have `role='button'` on trigger", async ({ page, renderer }) => {
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("role", "button")
    })

    test("should have `aria-haspopup='menu'` on trigger", async ({ page, renderer }) => {
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-haspopup", "menu")
    })

    test("should have `tabindex='0'` on trigger", async ({ page, renderer }) => {
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("tabindex", "0")
    })

    test("should have `aria-expanded='false'` on trigger when closed", async ({
      page,
      renderer,
    }) => {
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "false")
    })

    test("should have `aria-expanded='true'` on trigger when open", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "true")
    })

    test("should have `aria-controls` on trigger matching menu list id", async ({
      page,
      renderer,
    }) => {
      const ariaControls = await page.getByTestId("root-trigger").getAttribute("aria-controls")
      const listId = await page.getByTestId("root-list").getAttribute("id")
      expect(ariaControls).toBe(listId)
    })

    test("should have `role='menu'` on menu list", async ({ page, renderer }) => {
      await expect(page.getByTestId("root-list")).toHaveAttribute("role", "menu")
    })

    test("should have `popover='manual'` on menu list", async ({ page, renderer }) => {
      await expect(page.getByTestId("root-list")).toHaveAttribute("popover", "manual")
    })

    test("should have `aria-hidden='true'` on menu list when closed", async ({
      page,
      renderer,
    }) => {
      await expect(page.getByTestId("root-list")).toHaveAttribute("aria-hidden", "true")
    })

    test("should have `aria-hidden='false'` on menu list when open", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toHaveAttribute("aria-hidden", "false")
    })

    test("should have `role='menuitem'` on menu items", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-item-1")).toHaveAttribute("role", "menuitem")
      await expect(page.getByTestId("root-item-2")).toHaveAttribute("role", "menuitem")
      await expect(page.getByTestId("root-item-3")).toHaveAttribute("role", "menuitem")
    })

    test("should have `tabindex='-1'` on all menu items", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-item-1")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("root-item-2")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("root-item-3")).toHaveAttribute("tabindex", "-1")
    })

    test("should have `role='none'` on menu item wrapper li", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      const parent = page.getByTestId("root-item-1").locator("..")
      await expect(parent).toHaveAttribute("role", "none")
    })

    test("should have `aria-disabled='true'` on disabled menu items", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/menu/edge-cases`)
      await page.getByTestId("disabled-first-trigger").click()
      await expect(page.getByTestId("disabled-first-item-1")).toHaveAttribute(
        "aria-disabled",
        "true",
      )
      await expect(page.getByTestId("disabled-first-item-4")).toHaveAttribute(
        "aria-disabled",
        "true",
      )
    })

    test("should have `tabindex='-1'` on disabled menu items", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/menu/edge-cases`)
      await page.getByTestId("disabled-first-trigger").click()
      await expect(page.getByTestId("disabled-first-item-1")).toHaveAttribute("tabindex", "-1")
    })

    test("should have `role='menuitem'` on submenu trigger", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute("role", "menuitem")
    })

    test("should have `aria-haspopup='menu'` on submenu trigger", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "aria-haspopup",
        "menu",
      )
    })

    test("should have `tabindex='-1'` on submenu trigger", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute("tabindex", "-1")
    })

    test("should have `aria-expanded='false'` on submenu trigger when closed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "aria-expanded",
        "false",
      )
    })

    test("should have `aria-expanded='true'` on submenu trigger when open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "aria-expanded",
        "true",
      )
    })

    test("should have `role='menu'` on submenu list", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toHaveAttribute("role", "menu")
    })

    test("should have `aria-hidden='true'` on submenu list when closed", async ({
      page,
      renderer,
    }) => {
      await expect(page.getByTestId("root-submenu-list")).toHaveAttribute("aria-hidden", "true")
    })

    test("should have `aria-hidden='false'` on submenu list when open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toHaveAttribute("aria-hidden", "false")
    })

    test("should have `aria-labelledby` on menu list matching trigger id", async ({
      page,
      renderer,
    }) => {
      const triggerId = await page.getByTestId("root-trigger").getAttribute("id")
      await expect(page.getByTestId("root-list")).toHaveAttribute(
        "aria-labelledby",
        triggerId as string,
      )
    })

    test("should have `aria-labelledby` on submenu list matching submenu trigger id", async ({
      page,
      renderer,
    }) => {
      const triggerId = await page.getByTestId("root-submenu-trigger").getAttribute("id")
      await expect(page.getByTestId("root-submenu-list")).toHaveAttribute(
        "aria-labelledby",
        triggerId as string,
      )
    })
  })

  test.describe("Keyboard Navigation", () => {
    test("should open menu and focus first item when `Enter` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await expect(page.getByTestId("root-list")).toBeVisible()
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should open menu and focus first item when `Space` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Space")
      await expect(page.getByTestId("root-list")).toBeVisible()
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should open menu and focus first item when `ArrowDown` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("ArrowDown")
      await expect(page.getByTestId("root-list")).toBeVisible()
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should open menu and focus last item when `ArrowUp` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("ArrowUp")
      await expect(page.getByTestId("root-list")).toBeVisible()
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused()
    })

    test("should close menu and focus trigger when `Escape` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-trigger").press("Escape")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-trigger")).toBeFocused()
    })

    test("should close menu and focus trigger when `Escape` is pressed on menu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-trigger")).toBeFocused()
    })

    test("should close menu and move focus forward when `Tab` is pressed on menu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("focus-after")).toBeFocused()
    })

    test("should close menu and move focus backward when `Shift+Tab` is pressed on menu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.keyboard.press("Shift+Tab")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("focus-before")).toBeFocused()
    })

    test("should focus next item when `ArrowDown` is pressed", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-1").press("ArrowDown")
      await expect(page.getByTestId("root-item-2")).toBeFocused()
    })

    test("should focus previous item when `ArrowUp` is pressed", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-2").press("ArrowUp")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should loop to first item when `ArrowDown` is pressed on last item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").press("ArrowDown")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should loop to last item when `ArrowUp` is pressed on first item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-1").press("ArrowUp")
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused()
    })

    test("should focus first item when `Home` is pressed", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-2").press("Home")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should focus last item when `End` is pressed", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-2").press("End")
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused()
    })

    test("should not move focus when `ArrowLeft` is pressed on regular item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-1").press("ArrowLeft")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should not move focus when `ArrowRight` is pressed on regular item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-item-1").press("ArrowRight")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should focus first item when `ArrowDown` is pressed on trigger with menu already open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-trigger").press("ArrowDown")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
    })

    test("should focus last item when `ArrowUp` is pressed on trigger with menu already open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-trigger").press("ArrowUp")
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused()
    })
  })

  test.describe("Submenu Keyboard Navigation", () => {
    test("should open submenu and focus first item when `Enter` is pressed on submenu trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
    })

    test("should open submenu and focus first item when `Space` is pressed on submenu trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Space")
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
    })

    test("should open submenu and focus first item when `ArrowRight` is pressed on submenu trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("ArrowRight")
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
    })

    test("should close submenu and focus submenu trigger when `ArrowLeft` is pressed on submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-1").press("ArrowLeft")
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused()
    })

    test("should close submenu and focus submenu trigger when `Escape` is pressed on submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-1").press("Escape")
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused()
    })

    test("should focus next submenu item when `ArrowDown` is pressed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-1").press("ArrowDown")
      await expect(page.getByTestId("root-submenu-item-2")).toBeFocused()
    })

    test("should focus previous submenu item when `ArrowUp` is pressed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-2").press("ArrowUp")
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
    })

    test("should loop to first item when `ArrowDown` is pressed on last submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-3").press("ArrowDown")
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
    })

    test("should loop to last item when `ArrowUp` is pressed on first submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-1").press("ArrowUp")
      await expect(page.getByTestId("root-submenu-item-3")).toBeFocused()
    })

    test("should focus first submenu item when `Home` is pressed", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-2").press("Home")
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
    })

    test("should focus last submenu item when `End` is pressed", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await page.getByTestId("root-submenu-item-1").press("End")
      await expect(page.getByTestId("root-submenu-item-3")).toBeFocused()
    })

    test("should close all menus and move focus forward when `Tab` is pressed in submenu", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
      await page.keyboard.press("Tab")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
      await expect(page.getByTestId("focus-after")).toBeFocused()
    })

    test("should close all menus and move focus backward when `Shift+Tab` is pressed in submenu", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      await page.getByTestId("root-trigger").press("Enter")
      await page.getByTestId("root-submenu-trigger").focus()
      await page.getByTestId("root-submenu-trigger").press("Enter")
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused()
      await page.keyboard.press("Shift+Tab")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
      await expect(page.getByTestId("focus-before")).toBeFocused()
    })
  })

  test.describe("Mouse Interaction", () => {
    test("should open menu when trigger is clicked", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await expect(page.getByTestId("root-item-1")).not.toBeFocused()
    })

    test("should close menu and reset ARIA state when trigger is clicked again", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "true")
      await expect(page.getByTestId("root-list")).toHaveAttribute("aria-hidden", "false")
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "false")
      await expect(page.getByTestId("root-list")).toHaveAttribute("aria-hidden", "true")
    })

    test("should not open menu when trigger is hovered", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").hover()
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should close menu when clicking outside", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("scroll-container").click()
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should close all menus when clicking outside with submenu open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.getByTestId("scroll-container").click()
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
    })

    test("should close current menu and open new menu when a different root trigger is clicked", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      // dispatchEvent simulates a tap (click without mouse movement)
      await page.getByTestId("second-trigger").dispatchEvent("click")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("second-list")).toBeVisible()
    })

    test("should open submenu when submenu trigger is clicked", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").click()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
    })
    test("should close all menus when a menuitem is clicked", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-item-1").click()
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should close all menus when `Enter` is pressed on a menuitem", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-item-1").focus()
      await page.keyboard.press("Enter")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should close all menus when `Space` is pressed on a menuitem", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-item-1").focus()
      await page.keyboard.press("Space")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should close all menus when a submenu item is clicked", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.getByTestId("root-submenu-item-1").click()
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
    })

    test("should close all menus when `Enter` is pressed on a submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-submenu-trigger").focus()
      await page.keyboard.press("ArrowRight")
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.keyboard.press("Enter")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
    })

    test("should close all menus when `Space` is pressed on a submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-submenu-trigger").focus()
      await page.keyboard.press("ArrowRight")
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.keyboard.press("Space")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
    })

    test("should not close menu when a disabled menuitem is clicked", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/menu/edge-cases`)
      await page.getByTestId("disabled-first-trigger").click()
      await expect(page.getByTestId("disabled-first-list")).toBeVisible()
      await page.getByTestId("disabled-first-item-1").click({ force: true })
      await expect(page.getByTestId("disabled-first-list")).toBeVisible()
    })

    test("should not close menu when menuitem click propagation is stopped", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("root-item-1").evaluate((el) => {
        el.addEventListener("click", (e) => e.stopPropagation())
      })
      await page.getByTestId("root-item-1").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
    })

    test("should not move focus to item when hovered", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-item-1")).not.toBeFocused()
      await page.getByTestId("root-item-2").hover()
      await expect(page.getByTestId("root-item-2")).not.toBeFocused()
    })

    test("should open submenu when submenu trigger is hovered", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
    })

    test("should close submenu when hovering over different menu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.getByTestId("root-item-1").hover()
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible()
    })

    test("should keep submenu open when hovering items inside the submenu", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.getByTestId("root-submenu-item-2").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await expect(page.getByTestId("root-list")).toBeVisible()
    })

    test("should not close submenu when hovering the menu list container", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").click()
      await page.getByTestId("root-submenu-trigger").hover()
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
      await page.getByTestId("root-list").dispatchEvent("pointermove")
      await expect(page.getByTestId("root-submenu-list")).toBeVisible()
    })
  })

  test.describe("SVG Inside Trigger", () => {
    test("should open menu when clicking SVG inside trigger", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/menu/dropdown`)
      const svg = page.getByTestId("svg-icon")
      const list = page.getByTestId("svg-list")

      await expect(list).not.toBeVisible()
      await svg.click()
      await expect(list).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(list).not.toBeVisible()
    })
  })

  test.describe("Scroll Dismissal", () => {
    test("should close menu when scrolling a nested element", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.getByTestId("scroll-container").dispatchEvent("scroll")
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should close menu when scrolling the document", async ({ page, renderer }) => {
      await page.evaluate(() => {
        document.body.style.height = "3000px"
      })
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.evaluate(() => window.scrollBy(0, 100))
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })

    test("should keep menu open during keyboard navigation", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("ArrowUp")
      await expect(page.getByTestId("root-list")).toBeVisible()
    })

    test("should close menu when window is resized", async ({ page, renderer }) => {
      await page.getByTestId("root-trigger").click()
      await expect(page.getByTestId("root-list")).toBeVisible()
      await page.setViewportSize({ width: 800, height: 400 })
      await expect(page.getByTestId("root-list")).not.toBeVisible()
    })
  })

  test.describe("Scroll Prevention", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.evaluate(() => {
        document.body.style.height = "3000px"
        window.scrollTo(0, 500)
      })
    })

    test("should not scroll the page when `Space` is pressed on menu trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("Space")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })

    test("should not scroll the page when `ArrowDown` is pressed on menu trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("root-trigger").focus()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("ArrowDown")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })

    test("should not scroll the page when `ArrowDown` is pressed on menuitem", async ({
      page,
      renderer,
    }) => {
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.getByTestId("root-trigger").focus()
      await page.keyboard.press("Enter")
      await expect(page.getByTestId("root-item-1")).toBeFocused()
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.keyboard.press("ArrowDown")
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(scrollBefore)
    })
  })
})

test.describe("Cyclic Typeahead", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/typeahead`)
  })

  test("should focus matching item when letter key is pressed", async ({ page, renderer }) => {
    await page.getByTestId("typeahead-trigger").focus()
    await page.getByTestId("typeahead-trigger").press("Enter")
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused()
    await page.keyboard.press("b")
    await expect(page.getByTestId("typeahead-item-2")).toBeFocused()
  })

  test("should focus next matching item when same letter is pressed", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("typeahead-trigger").focus()
    await page.getByTestId("typeahead-trigger").press("Enter")
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused()
    await page.keyboard.press("a")
    await expect(page.getByTestId("typeahead-item-3")).toBeFocused()
  })

  test("should cycle back to first matching item", async ({ page, renderer }) => {
    await page.getByTestId("typeahead-trigger").focus()
    await page.getByTestId("typeahead-trigger").press("Enter")
    await page.getByTestId("typeahead-item-5").focus()
    await page.keyboard.press("a")
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused()
  })

  test("should skip disabled items", async ({ page, renderer }) => {
    await page.getByTestId("typeahead-trigger").focus()
    await page.getByTestId("typeahead-trigger").press("Enter")
    await page.getByTestId("typeahead-item-3").focus()
    await page.keyboard.press("a")
    await expect(page.getByTestId("typeahead-item-5")).toBeFocused()
  })

  test("should not move focus when no items match", async ({ page, renderer }) => {
    await page.getByTestId("typeahead-trigger").focus()
    await page.getByTestId("typeahead-trigger").press("Enter")
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused()
    await page.keyboard.press("z")
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused()
  })

  test("should allow normal arrow navigation after typeahead", async ({ page, renderer }) => {
    await page.getByTestId("typeahead-trigger").focus()
    await page.getByTestId("typeahead-trigger").press("Enter")
    await page.keyboard.press("b")
    await expect(page.getByTestId("typeahead-item-2")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("typeahead-item-3")).toBeFocused()
  })
})

test.describe("Edge Cases", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/edge-cases`)
  })

  test("should skip disabled items when opening menu with `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("disabled-first-trigger").focus()
    await page.getByTestId("disabled-first-trigger").press("Enter")
    await expect(page.getByTestId("disabled-first-item-2")).toBeFocused()
    await expect(page.getByTestId("disabled-first-item-1")).not.toBeFocused()
  })

  test("should skip disabled items when navigating with `ArrowDown`", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("disabled-first-trigger").focus()
    await page.getByTestId("disabled-first-trigger").press("Enter")
    await page.getByTestId("disabled-first-item-2").press("ArrowDown")
    await expect(page.getByTestId("disabled-first-item-3")).toBeFocused()
  })

  test("should skip disabled items when navigating with `ArrowUp`", async ({ page, renderer }) => {
    await page.getByTestId("disabled-first-trigger").focus()
    await page.getByTestId("disabled-first-trigger").press("Enter")
    await page.getByTestId("disabled-first-item-3").focus()
    await page.getByTestId("disabled-first-item-3").press("ArrowUp")
    await expect(page.getByTestId("disabled-first-item-2")).toBeFocused()
  })

  test("should focus first enabled item when `Home` is pressed with disabled first item", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("disabled-first-trigger").focus()
    await page.getByTestId("disabled-first-trigger").press("Enter")
    await page.getByTestId("disabled-first-item-3").press("Home")
    await expect(page.getByTestId("disabled-first-item-2")).toBeFocused()
  })

  test("should focus last enabled item when `End` is pressed with disabled last item", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("disabled-first-trigger").focus()
    await page.getByTestId("disabled-first-trigger").press("Enter")
    await page.getByTestId("disabled-first-item-2").press("End")
    await expect(page.getByTestId("disabled-first-item-3")).toBeFocused()
  })

  test("should open menu when all items are disabled", async ({ page, renderer }) => {
    await page.getByTestId("all-disabled-trigger").focus()
    await page.getByTestId("all-disabled-trigger").press("Enter")
    await expect(page.getByTestId("all-disabled-list")).toBeVisible()
  })

  test("should open empty menu and update ARIA state", async ({ page, renderer }) => {
    await page.getByTestId("no-items-trigger").click()
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "true")
    await expect(page.getByTestId("no-items-list")).toHaveAttribute("aria-hidden", "false")
  })

  test("should close empty menu when `Escape` is pressed", async ({ page, renderer }) => {
    await page.getByTestId("no-items-trigger").focus()
    await page.getByTestId("no-items-trigger").press("Enter")
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "false")
    await expect(page.getByTestId("no-items-list")).toHaveAttribute("aria-hidden", "true")
  })

  test("should handle keyboard navigation in empty menu", async ({ page, renderer }) => {
    await page.getByTestId("no-items-trigger").focus()
    await page.getByTestId("no-items-trigger").press("Enter")
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "true")
    await expect(page.getByTestId("no-items-trigger")).toBeFocused()
  })
})

test.describe("Menubar", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/menubar`)
  })

  test.describe("ARIA Attributes", () => {
    test("should have `role='menubar'` on menubar list", async ({ page, renderer }) => {
      await expect(page.getByTestId("menubar-list")).toHaveAttribute("role", "menubar")
    })

    test("should have `role='menuitem'` on menubar triggers", async ({ page, renderer }) => {
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("role", "menuitem")
      await expect(page.getByTestId("menubar-trigger-2")).toHaveAttribute("role", "menuitem")
      await expect(page.getByTestId("menubar-trigger-3")).toHaveAttribute("role", "menuitem")
    })

    test("should have `tabindex='0'` on first menubar trigger", async ({ page, renderer }) => {
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("tabindex", "0")
    })

    test("should have `tabindex='-1'` on non-first menubar triggers", async ({
      page,
      renderer,
    }) => {
      await expect(page.getByTestId("menubar-trigger-2")).toHaveAttribute("tabindex", "-1")
      await expect(page.getByTestId("menubar-trigger-3")).toHaveAttribute("tabindex", "-1")
    })

    test("should have `aria-haspopup='menu'` on menubar triggers", async ({ page, renderer }) => {
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("aria-haspopup", "menu")
    })

    test("should have `aria-expanded='false'` on menubar trigger when closed", async ({
      page,
      renderer,
    }) => {
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("aria-expanded", "false")
    })

    test("should have `aria-expanded='true'` on menubar trigger when open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").click()
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("aria-expanded", "true")
    })
  })

  test.describe("Keyboard Navigation", () => {
    test("should move focus to next menubar item when `ArrowRight` is pressed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("ArrowRight")
      await expect(page.getByTestId("menubar-item-1")).toBeFocused()
    })

    test("should move focus to previous menubar item when `ArrowLeft` is pressed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-2").focus()
      await page.getByTestId("menubar-trigger-2").press("ArrowLeft")
      await expect(page.getByTestId("menubar-item-1")).toBeFocused()
    })

    test("should loop to first menubar item when `ArrowRight` is pressed on last item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-3").focus()
      await page.getByTestId("menubar-trigger-3").press("ArrowRight")
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused()
    })

    test("should loop to last menubar item when `ArrowLeft` is pressed on first item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("ArrowLeft")
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused()
    })

    test("should move focus to first menubar item when `Home` is pressed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-2").focus()
      await page.getByTestId("menubar-trigger-2").press("Home")
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused()
    })

    test("should move focus to last menubar item when `End` is pressed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("End")
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused()
    })

    test("should open menu and focus first item when `Enter` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Enter")
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused()
    })

    test("should open menu and focus first item when `Space` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Space")
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused()
    })

    test("should open menu and focus first item when `ArrowDown` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("ArrowDown")
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused()
    })

    test("should open menu and focus last item when `ArrowUp` is pressed on trigger", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("ArrowUp")
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused()
    })

    test("should close menu and move to previous menubar item when `ArrowLeft` is pressed on menu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-2").focus()
      await page.getByTestId("menubar-trigger-2").press("Enter")
      await page.getByTestId("menubar-item-2-1").focus()
      await page.getByTestId("menubar-item-2-1").press("ArrowLeft")
      await expect(page.getByTestId("menubar-item-1")).toBeFocused()
      await expect(page.getByTestId("menubar-list-2")).not.toBeVisible()
    })

    test("should open previous trigger's menu when `ArrowLeft` navigates to a trigger from menu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Enter")
      await page.getByTestId("menubar-item-1-1").focus()
      await page.getByTestId("menubar-item-1-1").press("ArrowLeft")
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused()
      await expect(page.getByTestId("menubar-list-3")).toBeVisible()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
    })

    test("should open previous trigger's menu when `ArrowLeft` is pressed on trigger with menu open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").click()
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await page.getByTestId("menubar-trigger-1").press("ArrowLeft")
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused()
      await expect(page.getByTestId("menubar-list-3")).toBeVisible()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
    })

    test("should close menu and move to next menubar item when `ArrowRight` is pressed on menu item without submenu", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Enter")
      await page.getByTestId("menubar-item-1-1").focus()
      await page.getByTestId("menubar-item-1-1").press("ArrowRight")
      await expect(page.getByTestId("menubar-item-1")).toBeFocused()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
    })

    test("should close all menus and move to next menubar item when `ArrowRight` is pressed on submenu item", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Enter")
      await page.getByTestId("menubar-submenu-trigger-1").focus()
      await page.getByTestId("menubar-submenu-trigger-1").press("Enter")
      await page.getByTestId("menubar-submenu-item-1-1").press("ArrowRight")
      await expect(page.getByTestId("menubar-item-1")).toBeFocused()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
      await expect(page.getByTestId("menubar-submenu-list-1")).not.toBeVisible()
    })

    test("should move to previous menubar trigger when `ArrowLeft` is pressed on submenu trigger with submenu closed", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Enter")
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("ArrowDown")
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused()
      await expect(page.getByTestId("menubar-submenu-list-1")).not.toBeVisible()
      await page.keyboard.press("ArrowLeft")
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused()
      await expect(page.getByTestId("menubar-list-3")).toBeVisible()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
    })

    test("should not auto-open menu when `ArrowRight` is pressed on standalone menuitem after closing menu", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus()
      await page.getByTestId("menubar-trigger-1").press("Enter")
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await page.getByTestId("menubar-item-1-1").press("ArrowRight")
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
      await expect(page.getByTestId("menubar-item-1")).toBeFocused()
      await page.getByTestId("menubar-item-1").press("ArrowRight")
      await expect(page.getByTestId("menubar-trigger-2")).toBeFocused()
      await expect(page.getByTestId("menubar-list-2")).not.toBeVisible()
    })
  })

  test.describe("Mouse Interaction", () => {
    test("should not open menu when trigger is hovered initially", async ({ page, renderer }) => {
      await page.getByTestId("menubar-trigger-1").hover()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
    })

    test("should open menu when trigger is clicked", async ({ page, renderer }) => {
      await page.getByTestId("menubar-trigger-1").click()
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await expect(page.getByTestId("menubar-item-1-1")).not.toBeFocused()
    })

    test("should switch to hovered trigger's menu when another menu is already open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").click()
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await page.getByTestId("menubar-trigger-2").hover()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
      await expect(page.getByTestId("menubar-list-2")).toBeVisible()
    })

    test("should switch menus when hovering over non-adjacent trigger with menu open", async ({
      page,
      renderer,
    }) => {
      await page.getByTestId("menubar-trigger-1").click()
      await expect(page.getByTestId("menubar-list-1")).toBeVisible()
      await page.getByTestId("menubar-trigger-3").hover()
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible()
      await expect(page.getByTestId("menubar-list-3")).toBeVisible()
    })
  })
})

test.describe("Separate Menus", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/separate`)
  })

  test("should not open second menu when hovering its trigger while first menu is open", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("menu-a-trigger").click()
    await expect(page.getByTestId("menu-a-list")).toBeVisible()
    await page.getByTestId("menu-b-trigger").hover()
    await expect(page.getByTestId("menu-b-list")).not.toBeVisible()
    await expect(page.getByTestId("menu-a-list")).toBeVisible()
  })

  test("should not open first menu when hovering its trigger while second menu is open", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("menu-b-trigger").click()
    await expect(page.getByTestId("menu-b-list")).toBeVisible()
    await page.getByTestId("menu-a-trigger").hover()
    await expect(page.getByTestId("menu-a-list")).not.toBeVisible()
    await expect(page.getByTestId("menu-b-list")).toBeVisible()
  })

  test("should close first menu and open second when second trigger is clicked", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("menu-a-trigger").click()
    await expect(page.getByTestId("menu-a-list")).toBeVisible()
    await page.getByTestId("menu-b-trigger").dispatchEvent("click")
    await expect(page.getByTestId("menu-a-list")).not.toBeVisible()
    await expect(page.getByTestId("menu-b-list")).toBeVisible()
  })
})

test.describe("Menu Inside Collapsible Content", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/nested-content`)
  })

  test("should open menu and focus first item when `ArrowDown` is pressed on trigger", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("nested-menu-trigger").focus()
    await page.getByTestId("nested-menu-trigger").press("ArrowDown")
    await expect(page.getByTestId("nested-menu-list")).toBeVisible()
    await expect(page.getByTestId("nested-menu-item-1")).toBeFocused()
  })

  test("should open menu and focus last item when `ArrowUp` is pressed on trigger", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("nested-menu-trigger").focus()
    await page.getByTestId("nested-menu-trigger").press("ArrowUp")
    await expect(page.getByTestId("nested-menu-list")).toBeVisible()
    await expect(page.getByTestId("nested-menu-item-3")).toBeFocused()
  })

  test("should open menu and focus first item when `Enter` is pressed on trigger", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("nested-menu-trigger").focus()
    await page.getByTestId("nested-menu-trigger").press("Enter")
    await expect(page.getByTestId("nested-menu-list")).toBeVisible()
    await expect(page.getByTestId("nested-menu-item-1")).toBeFocused()
  })

  test("should open menu and focus first item when `Space` is pressed on trigger", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("nested-menu-trigger").focus()
    await page.getByTestId("nested-menu-trigger").press("Space")
    await expect(page.getByTestId("nested-menu-list")).toBeVisible()
    await expect(page.getByTestId("nested-menu-item-1")).toBeFocused()
  })

  test("should not scroll the sidebar when `ArrowDown` is pressed on trigger", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("nested-menu-trigger").focus()
    const scrollBefore = await page.getByTestId("sidebar").evaluate((el) => el.scrollTop)
    await page.keyboard.press("ArrowDown")
    const scrollAfter = await page.getByTestId("sidebar").evaluate((el) => el.scrollTop)
    expect(scrollAfter).toBe(scrollBefore)
  })
})

test.describe("Safety Triangle", () => {
  type PointerOpts = {
    testId: string
    x: number
    y: number
    movementX?: number
    movementY?: number
    pointerType?: string
  }

  async function pointer(page: import("@playwright/test").Page, opts: PointerOpts) {
    await page.evaluate((o) => {
      const el = document.querySelector(`[data-testid="${o.testId}"]`)
      if (el)
        el.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: o.x,
            clientY: o.y,
            movementX: o.movementX ?? 0,
            movementY: o.movementY ?? 0,
            pointerType: o.pointerType ?? "mouse",
            bubbles: true,
          }),
        )
    }, opts)
  }

  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/triangle`)
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("list")).toBeVisible()
    await page.getByTestId("submenu-trigger").hover()
    await expect(page.getByTestId("submenu-list")).toBeVisible()
  })

  test("should set `data-safe` on group when cursor moves within trigger rect", async ({
    page,
    renderer,
  }) => {
    const rect = await page.getByTestId("submenu-trigger").boundingBox()
    if (!rect) throw new Error("submenu-trigger not visible")

    await pointer(page, {
      testId: "submenu-trigger",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      movementX: 1,
    })

    await expect(page.getByTestId("group")).toHaveAttribute("data-safe", "")
  })

  test("should update triangle CSS variables when cursor moves within trigger rect", async ({
    page,
    renderer,
  }) => {
    const rect = await page.getByTestId("submenu-trigger").boundingBox()
    if (!rect) throw new Error("submenu-trigger not visible")

    const cy = rect.y + rect.height / 2

    await pointer(page, {
      testId: "submenu-trigger",
      x: rect.x + rect.width / 2,
      y: cy,
    })

    const center = await page
      .getByTestId("group")
      .evaluate((el) => el.style.getPropertyValue("--center"))
    expect(center).toBe(`${cy}px`)
  })

  test("should remove `data-safe` when cursor has sustained velocity away from submenu", async ({
    page,
    renderer,
  }) => {
    const rect = await page.getByTestId("submenu-trigger").boundingBox()
    if (!rect) throw new Error("submenu-trigger not visible")

    // Set data-safe by moving inside trigger rect
    await pointer(page, {
      testId: "submenu-trigger",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    })
    await expect(page.getByTestId("group")).toHaveAttribute("data-safe", "")

    // Dispatch multiple events on the group (triangle area), outside trigger rect,
    // with sustained negative movementX (away from right-opening submenu)
    for (let i = 0; i < 5; i++) {
      await pointer(page, {
        testId: "group",
        x: rect.x - 10,
        y: rect.y + rect.height / 2,
        movementX: -5,
      })
    }

    await expect(page.getByTestId("group")).not.toHaveAttribute("data-safe")
  })

  test("should remove `data-safe` when cursor leaves the triangle area entirely", async ({
    page,
    renderer,
  }) => {
    const rect = await page.getByTestId("submenu-trigger").boundingBox()
    if (!rect) throw new Error("submenu-trigger not visible")

    // Set data-safe
    await pointer(page, {
      testId: "submenu-trigger",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    })
    await expect(page.getByTestId("group")).toHaveAttribute("data-safe", "")

    // Dispatch outside trigger rect on a DIFFERENT element (not the group)
    // This means event.target !== safeGroup, so data-safe is removed immediately
    await pointer(page, {
      testId: "item-1",
      x: rect.x - 50,
      y: rect.y - 30,
    })

    await expect(page.getByTestId("group")).not.toHaveAttribute("data-safe")
  })

  test("should ignore touch pointer events for safety triangle", async ({ page, renderer }) => {
    const rect = await page.getByTestId("submenu-trigger").boundingBox()
    if (!rect) throw new Error("submenu-trigger not visible")

    // Dispatch touch pointermove inside trigger rect
    await pointer(page, {
      testId: "submenu-trigger",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      movementX: 1,
      pointerType: "touch",
    })

    // data-safe should NOT be set because touch events are ignored
    await expect(page.getByTestId("group")).not.toHaveAttribute("data-safe")
  })

  test("should set `data-safe` when cursor is inside trigger rect after reopening submenu", async ({
    page,
    renderer,
  }) => {
    const rect = await page.getByTestId("submenu-trigger").boundingBox()
    if (!rect) throw new Error("submenu-trigger not visible")

    // Close submenu by hovering item-1, then reopen by hovering submenu-trigger
    await page.getByTestId("item-1").hover()
    await expect(page.getByTestId("submenu-list")).not.toBeVisible()
    await page.getByTestId("submenu-trigger").hover()
    await expect(page.getByTestId("submenu-list")).toBeVisible()

    // Cursor inside trigger rect should set data-safe
    await pointer(page, {
      testId: "submenu-trigger",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      movementX: -1,
    })

    await expect(page.getByTestId("group")).toHaveAttribute("data-safe", "")
  })
})

test.describe("Checkbox Items", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/checkbox-radio`)
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should have `role='menuitemcheckbox'` on checkbox items", async ({ page, renderer }) => {
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("role", "menuitemcheckbox")
    await expect(page.getByTestId("checkbox-2")).toHaveAttribute("role", "menuitemcheckbox")
  })

  test("should have correct initial `aria-checked` values", async ({ page, renderer }) => {
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("aria-checked", "false")
    await expect(page.getByTestId("checkbox-2")).toHaveAttribute("aria-checked", "true")
  })

  test("should toggle `aria-checked` on click", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-1").click()
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("aria-checked", "true")
  })

  test("should uncheck when already checked on click", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-2").click()
    await expect(page.getByTestId("checkbox-2")).toHaveAttribute("aria-checked", "false")
  })

  test("should keep menu open after checkbox click", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-1").click()
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should toggle `aria-checked` on `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-1").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should toggle `aria-checked` on `Space`", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-1").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should include checkbox items in keyboard navigation", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-1").focus()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("checkbox-2")).toBeFocused()
  })

  test("should skip disabled checkbox item in navigation", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-2").focus()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("radio-a1")).toBeFocused()
  })

  test("should have `aria-disabled='true'` on disabled checkbox item", async ({
    page,
    renderer,
  }) => {
    await expect(page.getByTestId("checkbox-disabled")).toHaveAttribute("aria-disabled", "true")
  })
})

test.describe("Radio Items", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/checkbox-radio`)
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should have `role='menuitemradio'` on radio items", async ({ page, renderer }) => {
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("role", "menuitemradio")
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("role", "menuitemradio")
  })

  test("should have correct initial `aria-checked` values", async ({ page, renderer }) => {
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "false")
    await expect(page.getByTestId("radio-a3")).toHaveAttribute("aria-checked", "false")
  })

  test("should check clicked radio and uncheck same-group siblings on click", async ({
    page,
    renderer,
  }) => {
    await page.getByTestId("radio-a2").click()
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "false")
    await expect(page.getByTestId("radio-a3")).toHaveAttribute("aria-checked", "false")
  })

  test("should not affect different group when clicking radio", async ({ page, renderer }) => {
    await page.getByTestId("radio-a2").click()
    await expect(page.getByTestId("radio-b1")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("radio-b2")).toHaveAttribute("aria-checked", "false")
  })

  test("should keep menu open after radio click", async ({ page, renderer }) => {
    await page.getByTestId("radio-a2").click()
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should check radio on `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("radio-a2").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "false")
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should check radio on `Space`", async ({ page, renderer }) => {
    await page.getByTestId("radio-a3").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("radio-a3")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "false")
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should include radio items in keyboard navigation", async ({ page, renderer }) => {
    await page.getByTestId("radio-a1").focus()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("radio-a2")).toBeFocused()
  })
})

test.describe("Separator Navigation", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/checkbox-radio`)
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("list")).toBeVisible()
  })

  test("should have `role='separator'` on separator elements", async ({ page, renderer }) => {
    await expect(page.getByTestId("separator-1")).toHaveAttribute("role", "separator")
    await expect(page.getByTestId("separator-2")).toHaveAttribute("role", "separator")
  })

  test("should skip separator when navigating with `ArrowDown`", async ({ page, renderer }) => {
    await page.getByTestId("checkbox-2").focus()
    await page.keyboard.press("ArrowDown")
    // Skips disabled checkbox and separator
    await expect(page.getByTestId("radio-a1")).toBeFocused()
  })

  test("should skip separator when navigating with `ArrowUp`", async ({ page, renderer }) => {
    await page.getByTestId("radio-a1").focus()
    await page.keyboard.press("ArrowUp")
    // Skips separator and disabled checkbox
    await expect(page.getByTestId("checkbox-2")).toBeFocused()
  })

  test("should close menu when regular menuitem is clicked", async ({ page, renderer }) => {
    await page.getByTestId("regular-item").click()
    await expect(page.getByTestId("list")).not.toBeVisible()
  })
})

test.describe("Click Handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/dropdown`)
  })

  test("should fire click handler on trigger click", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked")
  })

  test("should fire click handler on trigger `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked")
  })

  test("should fire click handler on trigger `Space`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked")
  })

  test("should fire click handler on menuitem click", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("item").click()
    await expect(page.getByTestId("output")).toHaveText("item-clicked")
  })

  test("should fire click handler on menuitem `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("item").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("output")).toHaveText("item-clicked")
  })

  test("should fire click handler on menuitem `Space`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("item").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("output")).toHaveText("item-clicked")
  })

  test("should fire click handler on checkbox click", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("checkbox").click()
    await expect(page.getByTestId("output")).toHaveText("checkbox-clicked")
  })

  test("should fire click handler on checkbox `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("checkbox").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("output")).toHaveText("checkbox-clicked")
  })

  test("should fire click handler on checkbox `Space`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("checkbox").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("output")).toHaveText("checkbox-clicked")
  })

  test("should fire click handler on radio click", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("radio-2").click()
    await expect(page.getByTestId("output")).toHaveText("radio-2-clicked")
  })

  test("should fire click handler on radio `Enter`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("radio-2").focus()
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("output")).toHaveText("radio-2-clicked")
  })

  test("should fire click handler on radio `Space`", async ({ page, renderer }) => {
    await page.getByTestId("trigger").click()
    await page.getByTestId("radio-2").focus()
    await page.keyboard.press("Space")
    await expect(page.getByTestId("output")).toHaveText("radio-2-clicked")
  })
})

test.describe("Dynamic", () => {
  test("should handle dynamic items, submenu, checkbox, radio, disabled, href, label, separator, multi-instance, props passthrough", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/menu/dynamic`)

    // Props passthrough: className on Root reaches DOM
    await expect(page.getByTestId("menu-root")).toHaveClass(/menu-root/)

    // Open menu, navigate existing items
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("list")).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("item-1")).toBeFocused()
    await page.keyboard.press("Escape")

    // Add item via state, reopen → new item is navigable
    await page.getByTestId("add-item").click()
    await page.getByTestId("trigger").click()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("item-1")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("item-4")).toBeFocused()
    await page.keyboard.press("Escape")

    // Remove item via state → navigation wraps without it
    await page.getByTestId("remove-item").click()
    await page.getByTestId("remove-item").click()
    await page.getByTestId("trigger").click()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("item-1")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("item-2")).toBeFocused()
    await page.keyboard.press("Escape")

    // Add submenu via state → ArrowRight opens it
    await page.getByTestId("add-submenu").click()
    await page.getByTestId("trigger").click()
    await page.keyboard.press("ArrowDown")
    // Navigate to submenu trigger (last navigable item)
    const focused = page.getByTestId("submenu-trigger")
    while (!(await focused.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press("ArrowDown")
    }
    await page.keyboard.press("ArrowRight")
    await expect(page.getByTestId("submenu-list")).toBeVisible()
    await expect(page.getByTestId("submenu-item-1")).toBeFocused()
    await page.keyboard.press("Escape")
    await page.keyboard.press("Escape")

    // onClick fires on menu item
    await page.getByTestId("trigger").click()
    await page.getByTestId("item-1").click()
    await expect(page.getByTestId("output")).toHaveText("item-1-clicked")

    // href Item renders <a> with role="menuitem"
    await page.getByTestId("trigger").click()
    const hrefItem = page.getByTestId("item-href")
    await expect(hrefItem).toHaveRole("menuitem")
    await expect(hrefItem).toHaveAttribute("href", "https://example.com")
    const hrefTag = await hrefItem.evaluate((el) => el.tagName.toLowerCase())
    expect(hrefTag).toBe("a")
    await page.keyboard.press("Escape")

    // Label renders correct role, skipped in navigation
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("label")).toHaveRole("presentation")
    await page.keyboard.press("Escape")

    // Separator renders correct role
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("separator")).toHaveRole("separator")
    await page.keyboard.press("Escape")

    // CheckboxItem: toggle via state → aria-checked updates
    await page.getByTestId("trigger").click()
    const checkboxItem = page.getByTestId("checkbox-item")
    await expect(checkboxItem).toHaveRole("menuitemcheckbox")
    await expect(checkboxItem).toHaveAttribute("aria-checked", "false")
    await page.keyboard.press("Escape")
    await page.getByTestId("toggle-checked").click()
    await page.getByTestId("trigger").click()
    await expect(checkboxItem).toHaveAttribute("aria-checked", "true")
    await page.keyboard.press("Escape")

    // RadioItem: select via state → correct aria-checked, sibling unchecked
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("radio-a")).toHaveRole("menuitemradio")
    await expect(page.getByTestId("radio-a")).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("radio-b")).toHaveAttribute("aria-checked", "false")
    await page.keyboard.press("Escape")
    await page.getByTestId("select-radio-b").click()
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("radio-a")).toHaveAttribute("aria-checked", "false")
    await expect(page.getByTestId("radio-b")).toHaveAttribute("aria-checked", "true")
    await page.keyboard.press("Escape")

    // Disabled Item toggle → aria-disabled, skipped in nav
    await page.getByTestId("toggle-disabled").click()
    await page.getByTestId("trigger").click()
    await expect(page.getByTestId("item-2")).toHaveAttribute("aria-disabled", "true")
    await page.keyboard.press("ArrowDown")
    await expect(page.getByTestId("item-1")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    // Should skip item-2 (disabled) and land on the next navigable item
    await expect(page.getByTestId("item-2")).not.toBeFocused()
    await page.keyboard.press("Escape")

    // Second Menu instance: opening one doesn't affect the other
    await page.getByTestId("menu2-trigger").click()
    await expect(page.getByTestId("menu2-list")).toBeVisible()
    await expect(page.getByTestId("list")).not.toBeVisible()
    await page.keyboard.press("Escape")
  })
})
