import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { pointerDown, pointerUp, scrollAndSettle, setRtl } from "./helpers";

const openRoot = async (page: Page) => {
  await page.getByTestId("root-trigger").click();
  await expect(page.getByTestId("root-list")).toBeVisible();
};

const openRootViaPointer = async (page: Page) => {
  await pointerDown(page.getByTestId("root-trigger"));
  await expect(page.getByTestId("root-list")).toBeVisible();
};

const openRootViaKeyboard = async (page: Page) => {
  await page.getByTestId("root-trigger").focus();
  await page.getByTestId("root-trigger").press("Enter");
  await expect(page.getByTestId("root-list")).toBeVisible();
};

const openSubmenuViaHover = async (page: Page) => {
  await page.getByTestId("root-submenu-trigger").hover();
  await expect(page.getByTestId("root-submenu-list")).toBeVisible();
};

const openSubmenuViaKeyboard = async (page: Page) => {
  await page.getByTestId("root-submenu-trigger").focus();
  await page.getByTestId("root-submenu-trigger").press("Enter");
  await expect(page.getByTestId("root-submenu-list")).toBeVisible();
};

const focusPopover = (page: Page, testId: string) =>
  page.getByTestId(testId).evaluate((el) => {
    el.tabIndex = -1;
    el.focus();
  });

test.describe("Menu", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/basic`);
  });

  test.describe("ARIA", () => {
    test("declares the menu button contract on the trigger", async ({ page }) => {
      const trigger = page.getByTestId("root-trigger");
      const list = page.getByTestId("root-list");
      const listId = await list.getAttribute("id");
      const triggerId = await trigger.getAttribute("id");

      await expect(trigger).toHaveAttribute("role", "button");
      await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      await expect(trigger).toHaveAttribute("tabindex", "0");
      await expect(trigger).toHaveAttribute("aria-controls", listId as string);
      await expect(list).toHaveAttribute("role", "menu");
      await expect(list).toHaveAttribute("popover", "manual");
      await expect(list).toHaveAttribute("aria-labelledby", triggerId as string);
    });

    test("toggles `aria-expanded` / `aria-hidden` across the open and close cycle", async ({
      page,
    }) => {
      const trigger = page.getByTestId("root-trigger");
      const list = page.getByTestId("root-list");

      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(list).toHaveAttribute("aria-hidden", "true");

      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(list).toHaveAttribute("aria-hidden", "false");

      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(list).toHaveAttribute("aria-hidden", "true");
    });

    test("declares menuitem role and roving tabindex on every item", async ({ page }) => {
      await openRoot(page);
      for (const id of ["root-item-1", "root-item-2", "root-item-3"]) {
        await expect(page.getByTestId(id)).toHaveAttribute("role", "menuitem");
        await expect(page.getByTestId(id)).toHaveAttribute("tabindex", "-1");
      }
      await expect(page.getByTestId("root-item-1").locator("..")).toHaveAttribute("role", "none");
    });

    test("declares menuitem + `aria-haspopup` on the submenu trigger and links its submenu", async ({
      page,
    }) => {
      await openRoot(page);
      const subTrigger = page.getByTestId("root-submenu-trigger");
      const subList = page.getByTestId("root-submenu-list");
      const subTriggerId = await subTrigger.getAttribute("id");

      await expect(subTrigger).toHaveAttribute("role", "menuitem");
      await expect(subTrigger).toHaveAttribute("aria-haspopup", "menu");
      await expect(subTrigger).toHaveAttribute("tabindex", "-1");
      await expect(subTrigger).toHaveAttribute("aria-expanded", "false");
      await expect(subList).toHaveAttribute("aria-hidden", "true");
      await expect(subList).toHaveAttribute("role", "menu");
      await expect(subList).toHaveAttribute("aria-labelledby", subTriggerId as string);

      await openSubmenuViaHover(page);
      await expect(subTrigger).toHaveAttribute("aria-expanded", "true");
      await expect(subList).toHaveAttribute("aria-hidden", "false");
    });

    test("declares `aria-disabled` and skips disabled items in focus", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/menu/edge-cases`);
      await page.getByTestId("disabled-first-trigger").click();
      for (const id of ["disabled-first-item-1", "disabled-first-item-4"]) {
        await expect(page.getByTestId(id)).toHaveAttribute("aria-disabled", "true");
        await expect(page.getByTestId(id)).toHaveAttribute("tabindex", "-1");
      }
    });
  });

  test.describe("Trigger keyboard", () => {
    for (const key of ["Enter", "Space", "ArrowDown"] as const) {
      test(`${key} opens the menu and focuses the first item`, async ({ page }) => {
        await page.getByTestId("root-trigger").focus();
        await page.getByTestId("root-trigger").press(key);
        await expect(page.getByTestId("root-list")).toBeVisible();
        await expect(page.getByTestId("root-item-1")).toBeFocused();
      });
    }

    test("ArrowUp opens the menu and focuses the last item", async ({ page }) => {
      await page.getByTestId("root-trigger").focus();
      await page.getByTestId("root-trigger").press("ArrowUp");
      await expect(page.getByTestId("root-list")).toBeVisible();
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
    });

    test("Home / End on a closed trigger do not open the menu", async ({ page }) => {
      await page.getByTestId("root-trigger").focus();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await page.keyboard.press("End");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("Home / End from a click-opened trigger jump to first / last item", async ({ page }) => {
      await openRoot(page);
      await expect(page.getByTestId("root-trigger")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await page.getByTestId("root-trigger").focus();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("Escape from the trigger after open returns focus to the trigger and closes", async ({
      page,
    }) => {
      await openRootViaKeyboard(page);
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-trigger")).toBeFocused();
    });

    test("Tab closes the menu and moves focus forward; Shift+Tab moves it backward", async ({
      page,
    }) => {
      await openRootViaKeyboard(page);
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-after")).toBeFocused();

      await openRootViaKeyboard(page);
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-before")).toBeFocused();
    });

    test("Tab from a pointer-opened trigger closes the menu and moves focus forward", async ({
      page,
    }) => {
      await openRoot(page);
      await expect(page.getByTestId("root-trigger")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-after")).toBeFocused();

      await openRoot(page);
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-before")).toBeFocused();
    });

    test("ArrowDown on an already-open trigger focuses the first item", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-trigger").press("ArrowDown");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("ArrowUp on an already-open trigger focuses the last item", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-trigger").press("ArrowUp");
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
    });

    test("Enter on a click-opened menu button closes the menu", async ({ page }) => {
      await openRoot(page);
      await expect(page.getByTestId("root-trigger")).toBeFocused();
      await page.getByTestId("root-trigger").press("Enter");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });
  });

  test.describe("Item keyboard", () => {
    test.beforeEach(async ({ page }) => {
      await openRootViaKeyboard(page);
    });

    test("ArrowDown / ArrowUp wrap around the item list", async ({ page }) => {
      await expect(page.getByTestId("root-item-1")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-item-2")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("Home / End jump to first / last item", async ({ page }) => {
      await page.getByTestId("root-item-2").press("End");
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("ArrowDown skips disabled items, labels, and separators", async ({ page }) => {
      await page.getByTestId("root-item-3").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
    });

    test("ArrowLeft / ArrowRight on a regular item are inert (no submenu)", async ({ page }) => {
      await page.getByTestId("root-item-1").press("ArrowLeft");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
      await page.getByTestId("root-item-1").press("ArrowRight");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("Escape from an item closes the menu and returns focus to the trigger", async ({
      page,
    }) => {
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-trigger")).toBeFocused();
      await expect(page.getByTestId("root-trigger")).not.toHaveAttribute("data-highlighted");
    });
  });

  test.describe("Submenu keyboard", () => {
    test.beforeEach(async ({ page }) => {
      await openRootViaKeyboard(page);
    });

    for (const key of ["Enter", "Space", "ArrowRight"] as const) {
      test(`${key} on the submenu trigger opens it and focuses the first item`, async ({
        page,
      }) => {
        await page.getByTestId("root-submenu-trigger").focus();
        await page.getByTestId("root-submenu-trigger").press(key);
        await expect(page.getByTestId("root-submenu-list")).toBeVisible();
        await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
      });
    }

    for (const key of ["Enter", "Space", "ArrowRight"] as const) {
      test(`${key} on an open submenu trigger focuses the first item`, async ({ page }) => {
        await page.getByTestId("root-submenu-trigger").focus();
        await page.getByTestId("root-submenu-trigger").press("ArrowRight");
        await expect(page.getByTestId("root-submenu-list")).toBeVisible();
        await page.getByTestId("root-submenu-trigger").focus();
        await page.getByTestId("root-submenu-trigger").press(key);
        await expect(page.getByTestId("root-submenu-list")).toBeVisible();
        await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
        await expect(page.getByTestId("root-list")).toBeVisible();
        await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      });
    }

    for (const key of ["ArrowLeft", "Escape"] as const) {
      test(`${key} inside the submenu closes it and focuses the submenu trigger`, async ({
        page,
      }) => {
        await openSubmenuViaKeyboard(page);
        await page.getByTestId("root-submenu-item-1").press(key);
        await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
        await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
        await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
          "data-highlighted",
          "",
        );
      });
    }

    test("ArrowRight after ArrowLeft re-enters the submenu", async ({ page }) => {
      await openSubmenuViaKeyboard(page);
      await page.getByTestId("root-submenu-item-1").press("ArrowLeft");
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "data-highlighted",
        "",
      );
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("root-submenu-list")).toBeVisible();
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
    });

    test("ArrowDown after ArrowLeft roves the parent menu", async ({ page }) => {
      await openSubmenuViaKeyboard(page);
      await page.getByTestId("root-submenu-item-1").press("ArrowLeft");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("root-item-1")).toBeFocused();
      await expect(page.getByTestId("root-item-1")).toHaveAttribute("data-highlighted", "");
    });

    test("ArrowLeft opens and ArrowRight closes the submenu in RTL", async ({ page }) => {
      await setRtl(page);
      await page.getByTestId("root-submenu-trigger").focus();
      await page.getByTestId("root-submenu-trigger").press("ArrowLeft");
      await expect(page.getByTestId("root-submenu-list")).toBeVisible();
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "data-highlighted",
        "",
      );
    });

    test("ArrowDown / ArrowUp wrap around the submenu items", async ({ page }) => {
      await openSubmenuViaKeyboard(page);
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-submenu-item-2")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("root-submenu-item-3")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
    });

    test("Home / End jump within the submenu", async ({ page }) => {
      await openSubmenuViaKeyboard(page);
      await page.keyboard.press("End");
      await expect(page.getByTestId("root-submenu-item-3")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
    });

    test("Tab inside the submenu closes all menus and continues outside", async ({ page }) => {
      await openSubmenuViaKeyboard(page);
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-after")).toBeFocused();
    });

    test("Shift+Tab inside the submenu closes all menus and continues backward", async ({
      page,
    }) => {
      await openSubmenuViaKeyboard(page);
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-before")).toBeFocused();
    });
  });

  test.describe("Pointer session", () => {
    test("pointerdown on trigger opens the menu without moving focus to the first item", async ({
      page,
    }) => {
      await openRootViaPointer(page);
      await expect(page.getByTestId("root-item-1")).not.toBeFocused();
    });

    test("pointerdown on an open trigger toggles the menu closed", async ({ page }) => {
      await openRootViaPointer(page);
      await pointerDown(page.getByTestId("root-trigger"));
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("pointerdown outside dismisses the menu, including any open submenu", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await pointerDown(page.getByTestId("scroll-container"));
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
    });

    test("pointerdown on a different root trigger closes the first menu and opens the second", async ({
      page,
    }) => {
      await openRootViaPointer(page);
      await pointerDown(page.getByTestId("second-trigger"));
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("second-list")).toBeVisible();
    });

    test("click-only dispatch on a trigger does not open the menu", async ({ page }) => {
      await page.getByTestId("root-trigger").dispatchEvent("click");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("non-primary pointerdown on a trigger does not open the menu", async ({ page }) => {
      await pointerDown(page.getByTestId("root-trigger"), { button: 2 });
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("non-primary pointerdown outside does not dismiss an open menu", async ({ page }) => {
      await openRootViaPointer(page);
      await pointerDown(page.getByTestId("scroll-container"), { button: 2 });
      await expect(page.getByTestId("root-list")).toBeVisible();
    });

    test("non-primary pointerup on a menuitem does not activate it", async ({ page }) => {
      await openRootViaPointer(page);
      await pointerUp(page.getByTestId("root-item-1"), { button: 2 });
      await expect(page.getByTestId("root-list")).toBeVisible();
    });

    test("pointerup on a plain menuitem activates and closes all menus", async ({ page }) => {
      await openRootViaPointer(page);
      await pointerDown(page.getByTestId("root-item-1"));
      await expect(page.getByTestId("root-list")).toBeVisible();
      await pointerUp(page.getByTestId("root-item-1"));
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("pointerup on a submenu trigger does not close the menu as an item action", async ({
      page,
    }) => {
      await openRootViaPointer(page);
      await pointerUp(page.getByTestId("root-submenu-trigger"));
      await expect(page.getByTestId("root-list")).toBeVisible();
    });

    test("pointerdown on trigger, drag to item, pointerup activates (sticky)", async ({ page }) => {
      const trigger = page.getByTestId("root-trigger");
      const item = page.getByTestId("root-item-1");
      await trigger.hover();
      await page.mouse.down();
      await expect(page.getByTestId("root-list")).toBeVisible();
      await item.hover();
      await page.mouse.up();
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("pointerup outside after opening leaves the menu open (sticky miss)", async ({ page }) => {
      await openRootViaPointer(page);
      await pointerUp(page.getByTestId("scroll-container"));
      await expect(page.getByTestId("root-list")).toBeVisible();
    });
  });

  test.describe("Pointer session with disclosure", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/menu/with-disclosure`);
    });

    test("keyboard activation works after an abandoned pointer session", async ({ page }) => {
      await pointerDown(page.getByTestId("menu-trigger"));
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await page.getByTestId("disclosure-trigger").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("disclosure-content")).toBeVisible();
    });

    test("outside pointerdown onto a closed disclosure closes the menu; click opens the disclosure", async ({
      page,
    }) => {
      await pointerDown(page.getByTestId("menu-trigger"));
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await pointerDown(page.getByTestId("disclosure-trigger"));
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
      await page.getByTestId("disclosure-trigger").click();
      await expect(page.getByTestId("disclosure-content")).toBeVisible();
      await expect(page.getByTestId("disclosure-trigger")).toHaveAttribute("aria-expanded", "true");
    });
  });

  test.describe("Activation with dialog", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/menu/with-dialog`);
    });

    test("clicking a dialog-trigger menuitem opens the dialog and closes the menu", async ({
      page,
    }) => {
      await page.getByTestId("menu-trigger").click();
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await page.getByTestId("dialog-item").click();
      await expect(page.getByTestId("dialog-content")).toBeVisible();
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
    });

    for (const key of ["Enter", "Space"] as const) {
      test(`${key} on a dialog-trigger menuitem opens the dialog and closes the menu`, async ({
        page,
      }) => {
        await page.getByTestId("menu-trigger").focus();
        await page.keyboard.press("Enter");
        await expect(page.getByTestId("menu-item-1")).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await expect(page.getByTestId("dialog-item")).toBeFocused();
        await page.keyboard.press(key);
        await expect(page.getByTestId("dialog-content")).toBeVisible();
        await expect(page.getByTestId("menu-list")).not.toBeVisible();
      });
    }
  });

  test.describe("Mouse", () => {
    test("trigger click opens the menu without moving focus to the first item", async ({
      page,
    }) => {
      await openRoot(page);
      await expect(page.getByTestId("root-item-1")).not.toBeFocused();
    });

    test("trigger hover does not open the menu", async ({ page }) => {
      await page.getByTestId("root-trigger").hover();
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("outside click closes the menu, including any open submenu", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await page.getByTestId("scroll-container").click();
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
    });

    test("clicking a different root trigger closes the first menu and opens the second", async ({
      page,
    }) => {
      await openRoot(page);
      await pointerDown(page.getByTestId("second-trigger"));
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("second-list")).toBeVisible();
    });

    test("hovering an item focuses it so ArrowDown continues from there", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-item-2").hover();
      await expect(page.getByTestId("root-item-2")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-item-3")).toBeFocused();
    });

    test("arrows continue if hover-open leaves focus on the submenu popover", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await focusPopover(page, "root-submenu-list");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("root-submenu-list")).toBeVisible();
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
    });

    test("Escape after hover-opening a submenu highlights the submenu trigger", async ({
      page,
    }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("root-list")).toBeVisible();
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "data-highlighted",
        "",
      );
    });

    test("Tab still closes if hover-open leaves focus on the submenu popover", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await focusPopover(page, "root-submenu-list");
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("focus-after")).toBeFocused();
    });

    test("ArrowDown works if click-open leaves focus on the menu popover", async ({ page }) => {
      await openRoot(page);
      await focusPopover(page, "root-list");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("Home / End work if click-open leaves focus on the menu popover", async ({ page }) => {
      await openRoot(page);
      await focusPopover(page, "root-list");
      await page.keyboard.press("End");
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await focusPopover(page, "root-list");
      await page.keyboard.press("Home");
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("Escape from the menu popover closes without highlighting the trigger", async ({
      page,
    }) => {
      await openRoot(page);
      await focusPopover(page, "root-list");
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
      await expect(page.getByTestId("root-trigger")).toBeFocused();
      await expect(page.getByTestId("root-trigger")).not.toHaveAttribute("data-highlighted");
    });

    test("ArrowDown after a click on a label roves from the highlighted item", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-item-2").hover();
      await page.getByTestId("root-label").click();
      await expect(page.getByTestId("root-list")).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-list")).toBeVisible();
      await expect(page.getByTestId("root-item-3")).toBeFocused();
    });

    test("ArrowLeft from the submenu popover highlights the submenu trigger", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await focusPopover(page, "root-submenu-list");
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await expect(page.getByTestId("root-submenu-trigger")).toHaveAttribute(
        "data-highlighted",
        "",
      );
    });

    test("Home from the submenu popover roves the parent menu", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await focusPopover(page, "root-submenu-list");
      await page.keyboard.press("Home");
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("root-item-1")).toBeFocused();
    });

    test("Enter from the submenu popover focuses the first submenu item", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await focusPopover(page, "root-submenu-list");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
    });

    test("ArrowDown after hover-opening a submenu closes it", async ({ page }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      await expect(page.getByTestId("root-item-1")).toBeFocused();
      await expect(page.getByTestId("root-item-1")).toHaveAttribute("data-highlighted", "");
      await expect(page.getByTestId("root-list")).toBeVisible();
    });

    test("hovering a disabled item does not move focus", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-item-disabled").hover();
      await expect(page.getByTestId("root-trigger")).toBeFocused();
    });

    test("hovering a disabled item, label, or separator keeps highlight without moving focus", async ({
      page,
    }) => {
      await openRoot(page);
      await page.getByTestId("root-item-1").hover();
      await expect(page.getByTestId("root-item-1")).toHaveAttribute("data-highlighted", "");
      for (const id of ["root-item-disabled", "root-label", "root-separator"] as const) {
        await page.getByTestId(id).hover();
        await expect(page.getByTestId("root-item-1")).toBeFocused();
        await expect(page.getByTestId("root-item-1")).toHaveAttribute("data-highlighted", "");
        await page.getByTestId("root-item-1").hover();
      }
    });

    test("hovering out of the menu keeps highlight; ArrowDown continues from there", async ({
      page,
    }) => {
      await openRoot(page);
      await page.getByTestId("root-item-2").hover();
      await page.mouse.move(0, 0);
      await expect(page.getByTestId("root-item-2")).toBeFocused();
      await expect(page.getByTestId("root-item-2")).toHaveAttribute("data-highlighted", "");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-item-3")).toBeFocused();
    });

    test("hovering a submenu trigger opens its submenu; leaving to another item closes it", async ({
      page,
    }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await page.getByTestId("root-submenu-item-2").hover();
      await expect(page.getByTestId("root-submenu-list")).toBeVisible();
      await expect(page.getByTestId("root-list")).toBeVisible();

      await page.getByTestId("root-item-1").hover();
      await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
    });

    for (const [id, label] of [
      ["root-item-disabled", "a disabled item"],
      ["root-label", "a label"],
      ["root-separator", "a separator"],
    ] as const) {
      test(`hovering ${label} closes an open submenu`, async ({ page }) => {
        await openRoot(page);
        await openSubmenuViaHover(page);
        await page.getByTestId(id).hover();
        await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
        await expect(page.getByTestId("root-list")).toBeVisible();
      });
    }

    test("clicking the submenu trigger opens the submenu", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-submenu-trigger").click();
      await expect(page.getByTestId("root-submenu-list")).toBeVisible();
    });

    test("pointermove on the menu list container does not close an open submenu", async ({
      page,
    }) => {
      await openRoot(page);
      await openSubmenuViaHover(page);
      await page.getByTestId("root-list").dispatchEvent("pointermove");
      await expect(page.getByTestId("root-submenu-list")).toBeVisible();
    });

    for (const activation of ["click", "Enter", "Space"] as const) {
      test(`activating a regular menuitem via ${activation} closes all menus`, async ({ page }) => {
        await openRoot(page);
        if (activation === "click") {
          await page.getByTestId("root-item-1").click();
        } else {
          await page.getByTestId("root-item-1").focus();
          await page.keyboard.press(activation);
        }
        await expect(page.getByTestId("root-list")).not.toBeVisible();
      });

      test(`activating a submenu item via ${activation} closes all menus`, async ({ page }) => {
        await openRoot(page);
        await openSubmenuViaHover(page);
        if (activation === "click") {
          await page.getByTestId("root-submenu-item-1").click();
        } else {
          await page.getByTestId("root-submenu-item-1").focus();
          await page.keyboard.press(activation);
        }
        await expect(page.getByTestId("root-list")).not.toBeVisible();
        await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
      });
    }

    test("clicking a disabled menuitem keeps the menu open", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/menu/edge-cases`);
      await page.getByTestId("disabled-first-trigger").click();
      await page.getByTestId("disabled-first-item-1").click({ force: true });
      await expect(page.getByTestId("disabled-first-list")).toBeVisible();
    });

    test("a stopPropagation handler on the menuitem prevents the menu from closing", async ({
      page,
    }) => {
      await openRoot(page);
      await page.getByTestId("root-item-1").evaluate((el) => {
        el.addEventListener("pointerup", (e) => e.stopPropagation());
      });
      await page.getByTestId("root-item-1").click();
      await expect(page.getByTestId("root-list")).toBeVisible();
    });
  });

  test.describe("Highlight", () => {
    test("keyboard roving sets `data-highlighted` on the focused item", async ({ page }) => {
      await openRootViaKeyboard(page);
      await expect(page.getByTestId("root-item-1")).toHaveAttribute("data-highlighted", "");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("root-item-1")).not.toHaveAttribute("data-highlighted");
      await expect(page.getByTestId("root-item-2")).toHaveAttribute("data-highlighted", "");
    });

    test("pointermove sets `data-highlighted` on the item under the pointer", async ({ page }) => {
      await openRootViaPointer(page);
      await page.getByTestId("root-item-2").hover();
      await expect(page.getByTestId("root-item-2")).toHaveAttribute("data-highlighted", "");
      await expect(page.getByTestId("root-item-1")).not.toHaveAttribute("data-highlighted");
    });

    test("hold from the trigger still highlights the item under the pointer", async ({ page }) => {
      const trigger = page.getByTestId("root-trigger");
      const item = page.getByTestId("root-item-2");
      const box = await trigger.boundingBox();
      if (!box) throw new Error("missing bounding box");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect(page.getByTestId("root-list")).toBeVisible();
      const itemBox = await item.boundingBox();
      if (!itemBox) throw new Error("missing bounding box");
      await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
      await expect(item).toHaveAttribute("data-highlighted", "");
      await page.mouse.up();
    });
  });

  test.describe("Trigger with nested SVG", () => {
    test("clicking the SVG opens the menu", async ({ page }) => {
      const svg = page.getByTestId("svg-icon");
      const list = page.getByTestId("svg-list");
      await svg.click();
      await expect(list).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(list).not.toBeVisible();
    });
  });

  test.describe("Scroll dismissal", () => {
    test("scroll on a nested element closes the menu", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("scroll-container").dispatchEvent("scroll");
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("scroll inside the menu list itself does not close the menu", async ({ page }) => {
      await openRoot(page);
      await page.getByTestId("root-list").dispatchEvent("scroll");
      await expect(page.getByTestId("root-list")).toBeVisible();
    });

    test("scroll inside a scrollable region nested in the popover does not close the menu", async ({
      page,
      renderer,
    }) => {
      test.skip(renderer !== "html", "Core-only dismissal path; fixture is plain HTML");
      await page.goto("/html/menu/scrollable");
      await page.getByTestId("trigger").click();
      await expect(page.getByTestId("list")).toBeVisible();
      await page.getByTestId("scroll-region").evaluate(
        (el) =>
          new Promise<void>((resolve) => {
            el.addEventListener("scroll", () => resolve(), { once: true });
            el.scrollTop = 100;
          }),
      );
      await expect(page.getByTestId("list")).toBeVisible();
    });

    test("document scroll closes the menu", async ({ page }) => {
      await page.evaluate(() => {
        document.body.style.height = "3000px";
      });
      await openRoot(page);
      await page.evaluate(() => window.scrollBy(0, 100));
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });

    test("keyboard navigation between items does not dismiss the menu", async ({ page }) => {
      await openRoot(page);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("root-list")).toBeVisible();
    });

    test("viewport resize closes the menu", async ({ page }) => {
      await openRoot(page);
      await page.setViewportSize({ width: 800, height: 400 });
      await expect(page.getByTestId("root-list")).not.toBeVisible();
    });
  });

  test.describe("Scroll prevention", () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        document.body.style.height = "3000px";
      });
      await scrollAndSettle(page, 0, 500);
    });

    for (const [key, prep] of [
      ["Space", "trigger"],
      ["ArrowDown", "trigger"],
      ["ArrowDown", "item"],
    ] as const) {
      test(`${key} on the ${prep} does not scroll the page`, async ({ page }) => {
        if (prep === "item") {
          await scrollAndSettle(page, 0, 0);
          await openRootViaKeyboard(page);
        } else {
          await page.getByTestId("root-trigger").focus();
        }
        const before = await page.evaluate(() => window.scrollY);
        await page.keyboard.press(key);
        const after = await page.evaluate(() => window.scrollY);
        expect(after).toBe(before);
      });
    }
  });
});

test.describe("Typeahead", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/typeahead`);
    await page.getByTestId("typeahead-trigger").focus();
    await page.getByTestId("typeahead-trigger").press("Enter");
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused();
  });

  test("a letter focuses the first matching item; repeating it cycles", async ({ page }) => {
    await page.keyboard.press("b");
    await expect(page.getByTestId("typeahead-item-2")).toBeFocused();
    await page.getByTestId("typeahead-item-1").focus();
    await page.keyboard.press("a");
    await expect(page.getByTestId("typeahead-item-3")).toBeFocused();
    await page.keyboard.press("a");
    await expect(page.getByTestId("typeahead-item-5")).toBeFocused();
    await page.keyboard.press("a");
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused();
  });

  test("skips disabled items", async ({ page }) => {
    await page.getByTestId("typeahead-item-3").focus();
    await page.keyboard.press("a");
    await expect(page.getByTestId("typeahead-item-5")).toBeFocused();
  });

  test("a letter matches if click-open leaves focus on the menu popover", async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.getByTestId("typeahead-trigger").click();
    await page.getByRole("menu").evaluate((el) => {
      el.tabIndex = -1;
      el.focus();
    });
    await page.keyboard.press("b");
    await expect(page.getByTestId("typeahead-item-2")).toBeFocused();
  });

  test("a letter matches from a click-opened trigger", async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.getByTestId("typeahead-trigger").click();
    await expect(page.getByTestId("typeahead-trigger")).toBeFocused();
    await page.keyboard.press("b");
    await expect(page.getByTestId("typeahead-item-2")).toBeFocused();
  });

  test("no-op when no items match", async ({ page }) => {
    await page.keyboard.press("z");
    await expect(page.getByTestId("typeahead-item-1")).toBeFocused();
  });

  test("arrow navigation works after typeahead", async ({ page }) => {
    await page.keyboard.press("b");
    await expect(page.getByTestId("typeahead-item-2")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("typeahead-item-3")).toBeFocused();
  });

  test("a letter continues from the hovered item", async ({ page }) => {
    await page.getByTestId("typeahead-item-2").hover();
    await page.keyboard.press("a");
    await expect(page.getByTestId("typeahead-item-3")).toBeFocused();
  });

  test("matches items whose markup indents the label text", async ({ page, renderer }) => {
    test.skip(renderer !== "html", "Wrapper output carries no whitespace; hand-written HTML does");
    await page.goto("/html/menu/formatted");
    await page.getByTestId("trigger").focus();
    await page.getByTestId("trigger").press("Enter");
    await expect(page.getByTestId("item-profile")).toBeFocused();
    await page.keyboard.press("s");
    await expect(page.getByTestId("item-settings")).toBeFocused();
  });
});

test.describe("Edge cases", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/edge-cases`);
  });

  test("opening the menu via Enter skips a disabled first item", async ({ page }) => {
    await page.getByTestId("disabled-first-trigger").focus();
    await page.getByTestId("disabled-first-trigger").press("Enter");
    await expect(page.getByTestId("disabled-first-item-2")).toBeFocused();
  });

  test("arrow / Home / End all skip disabled items", async ({ page }) => {
    await page.getByTestId("disabled-first-trigger").focus();
    await page.getByTestId("disabled-first-trigger").press("Enter");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("disabled-first-item-3")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("disabled-first-item-2")).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByTestId("disabled-first-item-3")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByTestId("disabled-first-item-2")).toBeFocused();
  });

  test("an all-disabled menu still opens and arrows do not scroll", async ({ page }) => {
    await page.evaluate(() => {
      document.body.style.height = "3000px";
    });
    await page.getByTestId("all-disabled-trigger").focus();
    await page.getByTestId("all-disabled-trigger").press("Enter");
    await expect(page.getByTestId("all-disabled-list")).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await expect(page.getByTestId("all-disabled-list")).toBeVisible();
    await expect(page.getByTestId("all-disabled-trigger")).toBeFocused();
  });

  test("an empty menu opens, dismisses on Escape, and arrows do not scroll", async ({ page }) => {
    await page.evaluate(() => {
      document.body.style.height = "3000px";
    });
    await page.getByTestId("no-items-trigger").focus();
    await page.getByTestId("no-items-trigger").press("Enter");
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "true");
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("no-items-trigger")).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Menubar", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/menubar`);
  });

  test.describe("ARIA", () => {
    test("declares menubar / menuitem roles and roving tabindex", async ({ page }) => {
      await expect(page.getByTestId("menubar-list")).toHaveAttribute("role", "menubar");
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("tabindex", "0");
      for (const id of ["menubar-trigger-1", "menubar-trigger-2", "menubar-trigger-3"]) {
        await expect(page.getByTestId(id)).toHaveAttribute("role", "menuitem");
        await expect(page.getByTestId(id)).toHaveAttribute("aria-haspopup", "menu");
      }
      for (const id of ["menubar-trigger-2", "menubar-trigger-3"]) {
        await expect(page.getByTestId(id)).toHaveAttribute("tabindex", "-1");
      }
    });

    test("toggles `aria-expanded` across open and close", async ({ page }) => {
      const trigger = page.getByTestId("menubar-trigger-1");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  });

  test.describe("Keyboard navigation", () => {
    test("ArrowRight / ArrowLeft wrap around menubar items", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      // Backward navigation from a non-edge position.
      await page.getByTestId("menubar-trigger-2").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await page.getByTestId("menubar-trigger-3").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
    });

    test("ArrowRight / ArrowLeft reverse direction in RTL", async ({ page }) => {
      await setRtl(page);
      await page.getByTestId("menubar-trigger-1").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await page.getByTestId("menubar-trigger-2").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await page.getByTestId("menubar-trigger-3").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
    });

    test("Home / End jump to first / last menubar item", async ({ page }) => {
      await page.getByTestId("menubar-trigger-2").focus();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
    });

    test("Home / End on an open menubar trigger stay on the menubar", async ({ page }) => {
      await page.getByTestId("menubar-trigger-2").click();
      await expect(page.getByTestId("menubar-list-2")).toBeVisible();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await expect(page.getByTestId("menubar-item-2-1")).not.toBeFocused();
      await expect(page.getByTestId("menubar-list-2")).not.toBeVisible();
      await page.getByTestId("menubar-trigger-2").click();
      await page.keyboard.press("End");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
      await expect(page.getByTestId("menubar-item-2-1")).not.toBeFocused();
    });

    for (const key of ["Enter", "Space"] as const) {
      test(`${key} on an already-open menubar trigger focuses the first item`, async ({ page }) => {
        await page.getByTestId("menubar-trigger-1").click();
        await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
        await page.getByTestId("menubar-trigger-1").press(key);
        await expect(page.getByTestId("menubar-list-1")).toBeVisible();
        await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
      });
    }

    test("a letter from an open menubar trigger typeaheads the bar, not the menu", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.keyboard.press("s");
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await expect(page.getByTestId("menubar-submenu-trigger-1")).not.toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
    });

    test("a letter from a menubar menu item typeaheads the menu", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
      await page.keyboard.press("s");
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
    });

    for (const key of ["Enter", "Space", "ArrowDown"] as const) {
      test(`${key} on a menubar trigger opens its menu and focuses the first item`, async ({
        page,
      }) => {
        await page.getByTestId("menubar-trigger-1").focus();
        await page.getByTestId("menubar-trigger-1").press(key);
        await expect(page.getByTestId("menubar-list-1")).toBeVisible();
        await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
      });
    }

    test("ArrowUp on a menubar trigger opens its menu and focuses the last item", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.getByTestId("menubar-trigger-1").press("ArrowUp");
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
    });

    test("ArrowLeft from inside a menubar menu closes it and moves focus to the previous trigger", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-2").focus();
      await page.getByTestId("menubar-trigger-2").press("Enter");
      await page.getByTestId("menubar-item-2-1").focus();
      await page.getByTestId("menubar-item-2-1").press("ArrowLeft");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await expect(page.getByTestId("menubar-list-2")).not.toBeVisible();
    });

    test("ArrowLeft from a menubar menu lands on the previous trigger and opens its menu", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.getByTestId("menubar-item-1-1").focus();
      await page.getByTestId("menubar-item-1-1").press("ArrowLeft");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
      await expect(page.getByTestId("menubar-list-3")).toBeVisible();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
    });

    test("ArrowLeft on a menubar trigger with menu open jumps to the previous trigger and opens its menu", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-trigger-1").press("ArrowLeft");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
      await expect(page.getByTestId("menubar-list-3")).toBeVisible();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
    });

    test("ArrowRight on a menubar menuitem without submenu closes it and moves to the next trigger", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.getByTestId("menubar-item-1-1").focus();
      await page.getByTestId("menubar-item-1-1").press("ArrowRight");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
    });

    test("ArrowRight on a submenu item closes everything and moves to the next trigger", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.getByTestId("menubar-submenu-trigger-1").focus();
      await page.getByTestId("menubar-submenu-trigger-1").press("Enter");
      await page.getByTestId("menubar-submenu-item-1-1").press("ArrowRight");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-submenu-list-1")).not.toBeVisible();
    });

    test("ArrowLeft on a submenu trigger with submenu closed moves to the previous menubar trigger", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
      await expect(page.getByTestId("menubar-list-3")).toBeVisible();
    });

    test("ArrowRight from a non-menu standalone menuitem just navigates the menubar without opening", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").focus();
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.getByTestId("menubar-item-1-1").press("ArrowRight");
      await expect(page.getByTestId("menubar-item-1")).toBeFocused();
      await page.getByTestId("menubar-item-1").press("ArrowRight");
      await expect(page.getByTestId("menubar-trigger-2")).toBeFocused();
      await expect(page.getByTestId("menubar-list-2")).not.toBeVisible();
    });

    test("Escape closes the menu and returns focus to the trigger", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-item-1-1").hover();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("data-highlighted", "");
    });

    for (const key of ["ArrowLeft", "Escape"] as const) {
      test(`${key} inside a menubar submenu highlights the submenu trigger`, async ({ page }) => {
        await page.getByTestId("menubar-trigger-1").press("Enter");
        await page.getByTestId("menubar-submenu-trigger-1").press("Enter");
        await page.getByTestId("menubar-submenu-item-1-1").press(key);
        await expect(page.getByTestId("menubar-submenu-list-1")).not.toBeVisible();
        await expect(page.getByTestId("menubar-list-1")).toBeVisible();
        await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
        await expect(page.getByTestId("menubar-submenu-trigger-1")).toHaveAttribute(
          "data-highlighted",
          "",
        );
      });
    }

    test("ArrowRight after ArrowLeft re-enters the menubar submenu", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.getByTestId("menubar-submenu-trigger-1").press("Enter");
      await page.getByTestId("menubar-submenu-item-1-1").press("ArrowLeft");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-submenu-list-1")).toBeVisible();
      await expect(page.getByTestId("menubar-submenu-item-1-1")).toBeFocused();
    });

    test("ArrowDown after ArrowLeft roves the menubar menu", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").press("Enter");
      await page.getByTestId("menubar-submenu-trigger-1").press("Enter");
      await page.getByTestId("menubar-submenu-item-1-1").press("ArrowLeft");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("menubar-submenu-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
    });

    test("Tab from a pointer-opened menubar trigger closes the menu", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
    });
  });

  test.describe("Mouse", () => {
    test("trigger click opens the menu without moving focus", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").hover();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
      await page.getByTestId("menubar-trigger-1").click();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
      await expect(page.getByTestId("menubar-item-1-1")).not.toBeFocused();
    });

    test("ArrowDown works if click-open leaves focus on the menu popover", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await focusPopover(page, "menubar-list-1");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
    });

    test("Home from the menu popover stays on the menubar", async ({ page }) => {
      await page.getByTestId("menubar-trigger-2").click();
      await focusPopover(page, "menubar-list-2");
      await page.keyboard.press("Home");
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await expect(page.getByTestId("menubar-item-2-1")).not.toBeFocused();
    });

    test("Home from a painted menu item roves the menu, not the bar", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-submenu-trigger-1").hover();
      await focusPopover(page, "menubar-list-1");
      await page.keyboard.press("Home");
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
    });

    test("Escape from the menu popover highlights the menubar trigger", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await focusPopover(page, "menubar-list-1");
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("data-highlighted", "");
    });

    test("ArrowDown from the menu popover ignores a trigger painted by an earlier Escape", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute("data-highlighted", "");
      await page.getByTestId("menubar-trigger-2").click();
      await expect(page.getByTestId("menubar-trigger-1")).not.toHaveAttribute("data-highlighted");
      await focusPopover(page, "menubar-list-2");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("menubar-item-2-1")).toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
    });

    test("Tab still closes if click-open leaves focus on the menu popover", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await focusPopover(page, "menubar-list-1");
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
    });

    test("a letter from the menu popover typeaheads the menubar, not the menu", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await focusPopover(page, "menubar-list-1");
      await page.keyboard.press("s");
      await expect(page.getByTestId("menubar-submenu-trigger-1")).not.toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
    });

    test("hovering a submenu trigger opens it; ArrowRight enters", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-submenu-trigger-1").hover();
      await expect(page.getByTestId("menubar-submenu-list-1")).toBeVisible();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-submenu-item-1-1")).toBeFocused();
    });

    test("Escape after hover-opening a submenu highlights the submenu trigger", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-submenu-trigger-1").hover();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menubar-submenu-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
      await expect(page.getByTestId("menubar-submenu-trigger-1")).toHaveAttribute(
        "data-highlighted",
        "",
      );
    });

    test("arrows continue if hover-open leaves focus on the submenu popover", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-submenu-trigger-1").hover();
      await focusPopover(page, "menubar-submenu-list-1");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("menubar-submenu-item-1-1")).toBeFocused();
    });

    test("Escape after hover-switching highlights the new trigger", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-trigger-2").hover();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menubar-list-2")).not.toBeVisible();
      await expect(page.getByTestId("menubar-trigger-2")).toBeFocused();
      await expect(page.getByTestId("menubar-trigger-2")).toHaveAttribute("data-highlighted", "");
    });

    test("hovering out of a menubar menu keeps highlight; ArrowDown continues from there", async ({
      page,
    }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-item-1-1").hover();
      const box = await page.getByTestId("menubar-list-1").boundingBox();
      if (!box) throw new Error("missing bounding box");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height + 40);
      await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
      await expect(page.getByTestId("menubar-item-1-1")).toHaveAttribute("data-highlighted", "");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("menubar-item-1-1")).not.toBeFocused();
      await expect(page.getByTestId("menubar-list-1")).toBeVisible();
    });

    test("hovering an adjacent trigger switches the open menu", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-trigger-2").hover();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-list-2")).toBeVisible();
    });

    test("hovering a non-adjacent trigger also switches the open menu", async ({ page }) => {
      await page.getByTestId("menubar-trigger-1").click();
      await page.getByTestId("menubar-trigger-3").hover();
      await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
      await expect(page.getByTestId("menubar-list-3")).toBeVisible();
    });
  });
});

test.describe("Separate and mixed menus", () => {
  test("separate root menus do not switch on hover", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/separate`);
    await page.getByTestId("menu-a-trigger").click();
    await page.getByTestId("menu-b-trigger").hover();
    await expect(page.getByTestId("menu-b-list")).not.toBeVisible();
    await expect(page.getByTestId("menu-a-list")).toBeVisible();

    await pointerDown(page.getByTestId("menu-b-trigger"));
    await expect(page.getByTestId("menu-a-list")).not.toBeVisible();
    await expect(page.getByTestId("menu-b-list")).toBeVisible();

    // Symmetry: with menu B open, hovering menu A's trigger must not open A.
    await page.getByTestId("menu-a-trigger").hover();
    await expect(page.getByTestId("menu-a-list")).not.toBeVisible();
    await expect(page.getByTestId("menu-b-list")).toBeVisible();
  });

  test("hover-switch is scoped: standalone dropdown ↔ menubar, menubar A ↔ menubar B do not auto-switch", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/menu/mixed`);
    await page.getByTestId("dropdown-trigger").click();
    await page.getByTestId("menubar-a-trigger-1").hover();
    await expect(page.getByTestId("menubar-a-list-1")).not.toBeVisible();
    await expect(page.getByTestId("dropdown-list")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByTestId("menubar-a-trigger-1").click();
    await page.getByTestId("menubar-b-trigger-1").hover();
    await expect(page.getByTestId("menubar-b-list-1")).not.toBeVisible();
    await expect(page.getByTestId("menubar-a-list-1")).toBeVisible();

    // Same-menubar hover still switches.
    await page.getByTestId("menubar-a-trigger-2").hover();
    await expect(page.getByTestId("menubar-a-list-1")).not.toBeVisible();
    await expect(page.getByTestId("menubar-a-list-2")).toBeVisible();
  });
});

test.describe("Menu inside a collapsible sidebar", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/nested-content`);
  });

  for (const [key, expected] of [
    ["ArrowDown", "nested-menu-item-1"],
    ["ArrowUp", "nested-menu-item-3"],
    ["Enter", "nested-menu-item-1"],
    ["Space", "nested-menu-item-1"],
  ] as const) {
    test(`${key} opens the nested menu with focus on ${expected}`, async ({ page }) => {
      await page.getByTestId("nested-menu-trigger").focus();
      await page.getByTestId("nested-menu-trigger").press(key);
      await expect(page.getByTestId("nested-menu-list")).toBeVisible();
      await expect(page.getByTestId(expected)).toBeFocused();
    });
  }

  test("ArrowDown on the trigger does not scroll the surrounding sidebar", async ({ page }) => {
    await page.getByTestId("nested-menu-trigger").focus();
    const before = await page.getByTestId("sidebar").evaluate((el) => el.scrollTop);
    await page.keyboard.press("ArrowDown");
    const after = await page.getByTestId("sidebar").evaluate((el) => el.scrollTop);
    expect(after).toBe(before);
  });
});

test.describe("Safety triangle", () => {
  type PointerOpts = {
    testId: string;
    x: number;
    y: number;
    movementX?: number;
    movementY?: number;
    pointerType?: string;
  };

  const pointer = (page: Page, opts: PointerOpts) =>
    page.evaluate((o) => {
      const el = document.querySelector(`[data-testid="${o.testId}"]`);
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
        );
    }, opts);

  const arm = async (page: Page, testId = "submenu-trigger") => {
    const rect = await page.getByTestId(testId).boundingBox();
    if (!rect) throw new Error(`${testId} not visible`);
    await pointer(page, {
      testId,
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      movementX: 1,
    });
    return rect;
  };

  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/triangle`);
    await page.getByTestId("trigger").click();
    await page.getByTestId("submenu-trigger").hover();
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("diagonal travel toward the submenu does not close it", async ({ page }) => {
    const trigger = await arm(page);
    const submenu = await page.getByTestId("submenu-list").boundingBox();
    if (!submenu) throw new Error("submenu not visible");
    await pointer(page, {
      testId: "item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: 1,
    });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    await page.mouse.move(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await page.mouse.move(submenu.x + 8, submenu.y + submenu.height / 2, { steps: 12 });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("ArrowLeft from a nested submenu highlights the nested trigger", async ({ page }) => {
    await page.getByTestId("submenu2-trigger").hover();
    await expect(page.getByTestId("submenu2-list")).toBeVisible();
    await page.getByTestId("submenu2-trigger").press("ArrowRight");
    await page.getByTestId("submenu2-item-1").press("ArrowLeft");
    await expect(page.getByTestId("submenu2-list")).not.toBeVisible();
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    await expect(page.getByTestId("submenu2-trigger")).toBeFocused();
    await expect(page.getByTestId("submenu2-trigger")).toHaveAttribute("data-highlighted", "");
  });

  test("items under the triangle do not take focus", async ({ page }) => {
    const trigger = await arm(page);
    await expect(page.getByTestId("submenu-trigger")).toBeFocused();
    await pointer(page, {
      testId: "item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: 1,
    });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    await expect(page.getByTestId("item-1")).not.toBeFocused();
    await expect(page.getByTestId("submenu-trigger")).toBeFocused();
  });

  test("hovering a sibling item closes the submenu", async ({ page }) => {
    await arm(page);
    await page.getByTestId("item-1").hover();
    await expect(page.getByTestId("submenu-list")).not.toBeVisible();
  });

  test("moving away from the submenu closes it", async ({ page }) => {
    const trigger = await arm(page);
    await pointer(page, {
      testId: "item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: -5,
    });
    await expect(page.getByTestId("submenu-list")).not.toBeVisible();
  });

  test("touch pointer events are ignored", async ({ page }) => {
    const trigger = await arm(page);
    await pointer(page, {
      testId: "item-1",
      x: trigger.x + trigger.width / 2,
      y: trigger.y - 30,
      movementX: 1,
      pointerType: "touch",
    });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("entering the submenu disarms the triangle", async ({ page }) => {
    await arm(page);
    const submenu = await page.getByTestId("submenu-list").boundingBox();
    if (!submenu) throw new Error("submenu not visible");
    await page.mouse.move(submenu.x + 8, submenu.y + submenu.height / 2, { steps: 12 });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    await page.getByTestId("item-1").hover();
    await expect(page.getByTestId("submenu-list")).not.toBeVisible();
  });

  test("reopens cleanly after a sibling hover", async ({ page }) => {
    await page.getByTestId("item-1").hover();
    await expect(page.getByTestId("submenu-list")).not.toBeVisible();
    await page.getByTestId("submenu-trigger").hover();
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    const trigger = await arm(page);
    await pointer(page, {
      testId: "item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: 1,
    });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("diagonal travel toward a nested submenu does not close it", async ({ page }) => {
    await page.getByTestId("submenu2-trigger").hover();
    await expect(page.getByTestId("submenu2-list")).toBeVisible();
    const trigger = await arm(page, "submenu2-trigger");
    await pointer(page, {
      testId: "submenu-item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: 1,
    });
    await expect(page.getByTestId("submenu2-list")).toBeVisible();
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("moving away from a nested submenu closes it", async ({ page }) => {
    await page.getByTestId("submenu2-trigger").hover();
    await expect(page.getByTestId("submenu2-list")).toBeVisible();
    const trigger = await arm(page, "submenu2-trigger");
    await pointer(page, {
      testId: "submenu-item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: -5,
    });
    await expect(page.getByTestId("submenu2-list")).not.toBeVisible();
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("protects the parent submenu after a nested submenu closes", async ({ page }) => {
    await page.getByTestId("submenu2-trigger").hover();
    await expect(page.getByTestId("submenu2-list")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("submenu2-list")).not.toBeVisible();
    const trigger = await arm(page);
    await pointer(page, {
      testId: "item-1",
      x: trigger.x + trigger.width + 8,
      y: trigger.y + trigger.height / 2,
      movementX: 1,
    });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
  });

  test("protects a left-opening submenu in RTL", async ({ page }) => {
    await setRtl(page);
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("list")).not.toBeVisible();
    await page.getByTestId("trigger").click();
    await page.getByTestId("submenu-trigger").hover();
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    const trigger = await arm(page);
    await pointer(page, {
      testId: "item-1",
      x: trigger.x - 8,
      y: trigger.y + trigger.height / 2,
      movementX: -1,
    });
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    await pointer(page, {
      testId: "item-1",
      x: trigger.x - 12,
      y: trigger.y + trigger.height / 2,
      movementX: 5,
    });
    await expect(page.getByTestId("submenu-list")).not.toBeVisible();
  });
});

test.describe("Sibling submenus", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/siblings`);
    await page.getByTestId("trigger").click();
  });

  test("hovering a sibling submenu trigger replaces the open submenu", async ({ page }) => {
    await page.getByTestId("share-trigger").hover();
    await expect(page.getByTestId("share-list")).toBeVisible();
    await page.getByTestId("export-trigger").hover();
    await expect(page.getByTestId("export-list")).toBeVisible();
    await expect(page.getByTestId("share-list")).not.toBeVisible();
  });

  test("pointerdown on a sibling submenu trigger replaces the open submenu", async ({ page }) => {
    await page.getByTestId("share-trigger").hover();
    await expect(page.getByTestId("share-list")).toBeVisible();
    await pointerDown(page.getByTestId("export-trigger"));
    await expect(page.getByTestId("export-list")).toBeVisible();
    await expect(page.getByTestId("share-list")).not.toBeVisible();
  });

  test("ArrowRight after hover-opening a submenu enters it", async ({ page }) => {
    await page.getByTestId("share-trigger").hover();
    await expect(page.getByTestId("share-list")).toBeVisible();
    await expect(page.getByTestId("share-trigger")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("share-list")).toBeVisible();
    await expect(page.getByTestId("share-item-1")).toBeFocused();
  });

  test("ArrowDown after hover-opening a submenu closes it", async ({ page }) => {
    await page.getByTestId("share-trigger").hover();
    await expect(page.getByTestId("share-list")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("export-trigger")).toBeFocused();
    await expect(page.getByTestId("export-trigger")).toHaveAttribute("data-highlighted", "");
    await expect(page.getByTestId("share-list")).not.toBeVisible();
    await expect(page.getByTestId("list")).toBeVisible();
  });

  test("ArrowRight opens the focused sibling submenu", async ({ page }) => {
    await page.getByTestId("share-trigger").hover();
    await expect(page.getByTestId("share-list")).toBeVisible();
    await expect(page.getByTestId("share-trigger")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("export-trigger")).toBeFocused();
    await expect(page.getByTestId("share-list")).not.toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("export-list")).toBeVisible();
    await expect(page.getByTestId("share-list")).not.toBeVisible();
    await expect(page.getByTestId("export-item-1")).toBeFocused();
  });
});

test.describe("Checkbox and radio items", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/checkbox-radio`);
    await page.getByTestId("trigger").click();
  });

  test("the wrap seam scopes a bottom radio group from a top one", async ({ page, renderer }) => {
    test.skip(renderer !== "html", "Structure edge case; wrappers emit the canonical shape");
    // Groups touch the physical ends of the menu, so the sweep's
    // last-to-first wrap runs straight from group B into group A. The
    // seam must act as a group boundary or selecting in B clears A.
    await page.goto("/html/menu/radio-groups-at-ends");
    await page.getByTestId("trigger").click();
    await page.getByTestId("radio-b2").click();
    await expect(page.getByTestId("radio-b2")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-b1")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "false");
  });

  test("the wrap seam scopes a top radio group from a bottom one", async ({ page, renderer }) => {
    test.skip(renderer !== "html", "Structure edge case; wrappers emit the canonical shape");
    await page.goto("/html/menu/radio-groups-at-ends");
    await page.getByTestId("trigger").click();
    await page.getByTestId("radio-a2").click();
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("radio-b1")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-b2")).toHaveAttribute("aria-checked", "false");
  });

  test("Enter on a focused disabled item does not activate it", async ({ page }) => {
    await page.getByTestId("checkbox-disabled").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("checkbox-disabled")).toHaveAttribute("aria-checked", "false");
  });

  test("declares the menuitemcheckbox / menuitemradio / separator roles and initial `aria-checked`", async ({
    page,
  }) => {
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("role", "menuitemcheckbox");
    await expect(page.getByTestId("checkbox-1")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("checkbox-2")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("checkbox-disabled")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("role", "menuitemradio");
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("radio-a3")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("separator-1")).toHaveAttribute("role", "separator");
    await expect(page.getByTestId("separator-2")).toHaveAttribute("role", "separator");
  });

  for (const activation of ["click", "Enter", "Space"] as const) {
    test(`${activation} toggles a checkbox without closing the menu`, async ({ page }) => {
      if (activation === "click") {
        await page.getByTestId("checkbox-1").click();
      } else {
        await page.getByTestId("checkbox-1").focus();
        await page.keyboard.press(activation);
      }
      await expect(page.getByTestId("checkbox-1")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("list")).toBeVisible();
    });

    test(`${activation} selects a radio and unchecks same-group siblings without closing the menu`, async ({
      page,
    }) => {
      if (activation === "click") {
        await page.getByTestId("radio-a2").click();
      } else {
        await page.getByTestId("radio-a2").focus();
        await page.keyboard.press(activation);
      }
      await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "false");
      await expect(page.getByTestId("list")).toBeVisible();
    });
  }

  test("re-clicking a checked checkbox unchecks it", async ({ page }) => {
    await page.getByTestId("checkbox-2").click();
    await expect(page.getByTestId("checkbox-2")).toHaveAttribute("aria-checked", "false");
  });

  test("a separator scopes the radio group: changing one group does not affect the other", async ({
    page,
  }) => {
    await page.getByTestId("radio-a2").click();
    await expect(page.getByTestId("radio-b1")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-b2")).toHaveAttribute("aria-checked", "false");
  });

  test("selecting an earlier radio clears a later checked sibling", async ({ page }) => {
    await page.getByTestId("radio-a2").click();
    await page.getByTestId("radio-a1").click();
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "false");
  });

  test("radio sweep survives a boundary left behind by arrow navigation", async ({ page }) => {
    // ArrowDown past the disabled checkbox and separator records a
    // roving boundary; the subsequent mouse-click sweep must start
    // with a fresh one or it bails before clearing `radio-a1`.
    await page.getByTestId("checkbox-2").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("radio-a1")).toBeFocused();
    await page.getByTestId("radio-a2").click();
    await expect(page.getByTestId("radio-a2")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("radio-a1")).toHaveAttribute("aria-checked", "false");
  });

  test("arrow navigation skips disabled items and separators", async ({ page }) => {
    await page.getByTestId("checkbox-2").focus();
    await page.keyboard.press("ArrowDown");
    // Skips the disabled checkbox AND the separator
    await expect(page.getByTestId("radio-a1")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    // Skips the separator AND the disabled checkbox on the way back
    await expect(page.getByTestId("checkbox-2")).toBeFocused();
  });

  test("arrow navigation steps through enabled checkboxes and radios", async ({ page }) => {
    await page.getByTestId("checkbox-1").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("checkbox-2")).toBeFocused();

    await page.getByTestId("radio-a1").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("radio-a2")).toBeFocused();
  });

  test("activating a regular menuitem still closes the menu", async ({ page }) => {
    await page.getByTestId("regular-item").click();
    await expect(page.getByTestId("list")).not.toBeVisible();
  });
});

test.describe("Click handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/basic`);
  });

  for (const target of ["trigger", "item", "checkbox", "radio-2"] as const) {
    test(`${target} fires on click`, async ({ page }) => {
      if (target !== "trigger") await page.getByTestId("trigger").click();
      await page.getByTestId(target).click();
      await expect(page.getByTestId("output")).toHaveText(`${target}-clicked`);
    });
  }

  for (const key of ["Enter", "Space"] as const) {
    test(`trigger ${key} does not fire a click handler`, async ({ page }) => {
      await page.getByTestId("trigger").focus();
      await page.keyboard.press(key);
      await expect(page.getByTestId("output")).not.toHaveText("trigger-clicked");
    });
  }

  for (const target of ["item", "checkbox", "radio-2"] as const) {
    for (const key of ["Enter", "Space"] as const) {
      test(`${target} ${key} fires the click handler`, async ({ page }) => {
        await page.getByTestId("trigger").click();
        await page.getByTestId(target).focus();
        await page.keyboard.press(key);
        await expect(page.getByTestId("output")).toHaveText(`${target}-clicked`);
      });
    }
  }
});

test.describe("Link items", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/basic`);
    await page.getByTestId("trigger").click();
  });

  test("Enter on an href menuitem navigates", async ({ page }) => {
    await page.getByTestId("item-link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#menu-link-nav/);
    await expect(page.getByTestId("list")).not.toBeVisible();
  });

  test("Space on an href menuitem closes without navigating", async ({ page }) => {
    await page.getByTestId("item-link").focus();
    await page.keyboard.press("Space");
    await expect(page).not.toHaveURL(/#menu-link-nav/);
    await expect(page.getByTestId("list")).not.toBeVisible();
  });

  test("activating an href menuitem moves focus off the link before aria-hidden", async ({
    page,
  }) => {
    await page.getByTestId("item-link").click();
    await expect(page.getByTestId("list")).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByTestId("item-link")).not.toBeFocused();
    await expect(page.getByTestId("trigger")).toBeFocused();
  });

  test("pointerdown on trigger, drag to an href, pointerup navigates", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/menu/basic`);
    const trigger = page.getByTestId("trigger");
    const link = page.getByTestId("item-link");
    await trigger.hover();
    await page.mouse.down();
    await expect(page.getByTestId("list")).toBeVisible();
    await link.hover();
    await page.mouse.up();
    await expect(page).toHaveURL(/#menu-link-nav/);
    await expect(page.getByTestId("list")).not.toBeVisible();
    await expect(page.getByTestId("trigger")).toBeFocused();
  });
});

test.describe("Dynamic", () => {
  test("handles dynamic items, submenu, checkbox, radio, disabled, href, label, separator, and multi-instance", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/menu/dynamic`);

    await page.getByTestId("trigger").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("item-1")).toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByTestId("add-item").click();
    await page.getByTestId("trigger").click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("item-4")).toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByTestId("remove-item").click();
    await page.getByTestId("remove-item").click();
    await page.getByTestId("trigger").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("item-1")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("item-2")).toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByTestId("add-submenu").click();
    await page.getByTestId("trigger").click();
    await page.keyboard.press("ArrowDown");
    const focused = page.getByTestId("submenu-trigger");
    while (!(await focused.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press("ArrowDown");
    }
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("submenu-list")).toBeVisible();
    await expect(page.getByTestId("submenu-item-1")).toBeFocused();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    await page.getByTestId("trigger").click();
    await page.getByTestId("item-1").click();
    await expect(page.getByTestId("output")).toHaveText("item-1-clicked");

    await page.getByTestId("trigger").click();
    const hrefItem = page.getByTestId("item-href");
    await expect(hrefItem).toHaveRole("menuitem");
    await expect(hrefItem).toHaveAttribute("href", "https://example.com");
    await expect(hrefItem).toHaveJSProperty("tagName", "A");
    await page.keyboard.press("Escape");

    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("label")).toHaveRole("presentation");
    await expect(page.getByTestId("separator")).toHaveRole("separator");
    await page.keyboard.press("Escape");

    await page.getByTestId("trigger").click();
    const checkboxItem = page.getByTestId("checkbox-item");
    await expect(checkboxItem).toHaveRole("menuitemcheckbox");
    await expect(checkboxItem).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await page.getByTestId("toggle-checked").click();
    await page.getByTestId("trigger").click();
    await expect(checkboxItem).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");

    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("radio-a")).toHaveRole("menuitemradio");
    await expect(page.getByTestId("radio-a")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    await page.getByTestId("select-radio-b").click();
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("radio-a")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("radio-b")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");

    await page.getByTestId("toggle-disabled").click();
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("item-2")).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("item-1")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("item-2")).not.toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByTestId("menu2-trigger").click();
    await expect(page.getByTestId("menu2-list")).toBeVisible();
    await expect(page.getByTestId("list")).not.toBeVisible();
    await page.keyboard.press("Escape");
  });
});

test.describe("Structure independence", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/structure-independence`);
  });

  test("opens a menu where trigger and popover are bare siblings (no wrapper)", async ({
    page,
  }) => {
    await page.getByTestId("a-trigger").click();
    await expect(page.getByTestId("a-list")).toBeVisible();
    await expect(page.getByTestId("a-trigger")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("a-item-1")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("a-list")).not.toBeVisible();
  });

  test("opens a menu where trigger and popover are separated by unrelated DOM", async ({
    page,
  }) => {
    await page.getByTestId("b-trigger").click();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("b-item-1")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("b-item-2")).toBeFocused();
  });

  test("opens a menu (and its submenu) when trigger and popover live in different containers", async ({
    page,
  }) => {
    await page.getByTestId("c-trigger").click();
    await expect(page.getByTestId("c-list")).toBeVisible();
    // Hovering an item in the remotely-placed popover keeps the menu
    // open; the runtime resolves the trigger via aria-labelledby, not
    // DOM walking.
    await page.getByTestId("c-item-1").hover();
    await expect(page.getByTestId("c-list")).toBeVisible();

    // Hover already focused the item, so one ArrowDown reaches the
    // submenu trigger. The submenu popover lives in a sibling
    // <footer>; the runtime resolves it via aria-controls regardless.
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("c-submenu-trigger")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("c-submenu-list")).toBeVisible();
    await expect(page.getByTestId("c-sub-item-1")).toBeFocused();
  });

  test("an outside click dismisses a menu with a remotely-placed popover", async ({ page }) => {
    await page.getByTestId("c-trigger").click();
    // Click on unrelated chrome sitting between the trigger and popover
    // in DOM order. With the firstElementChild-based hover detection we
    // used to have, this could mis-resolve; with the aria-labelledby
    // lookup it is just an outside click.
    await page.getByTestId("main-c").click();
    await expect(page.getByTestId("c-list")).not.toBeVisible();
  });
});

test.describe("Disabled trigger", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/disabled-trigger`);
  });

  test("declares `aria-disabled` on the trigger", async ({ page }) => {
    await expect(page.getByTestId("trigger")).toHaveAttribute("aria-disabled", "true");
  });

  test("mouse click does not open the menu", async ({ page }) => {
    await page.getByTestId("trigger").click({ force: true });
    await expect(page.getByTestId("list")).not.toBeVisible();
    await expect(page.getByTestId("trigger")).toHaveAttribute("aria-expanded", "false");
  });

  test("Enter, ArrowDown, and ArrowUp do not open the menu", async ({ page }) => {
    await page.getByTestId("trigger").focus();
    for (const key of ["Enter", "ArrowDown", "ArrowUp"]) {
      await page.keyboard.press(key);
      await expect(page.getByTestId("list")).not.toBeVisible();
    }
  });
});

test.describe("Menubar dynamic", () => {
  test("keeps exactly one menubar tab stop across partial re-renders", async ({
    page,
    renderer,
  }) => {
    test.skip(renderer !== "react", "Exercises React render semantics");
    await page.goto("/react/menu/menubar-dynamic");
    await expect(page.getByTestId("trigger-1")).toHaveAttribute("tabindex", "0");
    await expect(page.getByTestId("trigger-2")).toHaveAttribute("tabindex", "-1");
    await page.evaluate(() => window.__bumpFirstMenu?.());
    await expect(page.getByTestId("trigger-1")).toHaveText("File v1");
    await expect(page.getByTestId("trigger-1")).toHaveAttribute("tabindex", "0");
    await expect(page.getByTestId("trigger-2")).toHaveAttribute("tabindex", "-1");
  });

  test("moves the tab stop on unmount and rejects late claimers", async ({ page, renderer }) => {
    test.skip(renderer !== "vue", "Exercises Vue reactivity semantics");
    await page.goto("/vue/menu/menubar-dynamic");
    await expect(page.getByTestId("trigger-1")).toHaveAttribute("tabindex", "0");
    await page.getByTestId("add-extra").click();
    await expect(page.getByTestId("trigger-3")).toHaveAttribute("tabindex", "-1");
    await expect(page.getByTestId("trigger-1")).toHaveAttribute("tabindex", "0");
    await page.getByTestId("remove-first").click();
    await expect(page.getByTestId("trigger-2")).toHaveAttribute("tabindex", "0");
    await expect(page.getByTestId("trigger-3")).toHaveAttribute("tabindex", "-1");
  });
});

test.describe("Positioning", () => {
  test("publishes the trigger rect and popover size as CSS variables on the popover", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/menu/basic`);
    await openRoot(page);
    const vars = await page
      .getByTestId("root-list")
      .evaluate((el) => [
        el.style.getPropertyValue("--top"),
        el.style.getPropertyValue("--right"),
        el.style.getPropertyValue("--bottom"),
        el.style.getPropertyValue("--left"),
        el.style.getPropertyValue("--width"),
        el.style.getPropertyValue("--height"),
      ]);
    for (const value of vars) expect(value).toMatch(/^-?\d+(\.\d+)?px$/);
  });
});
