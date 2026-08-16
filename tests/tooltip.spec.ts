import { expect, test } from "./fixtures";

test.describe("Tooltip", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/tooltip/basic`);
  });

  test.describe("ARIA", () => {
    test("links trigger to content via `aria-describedby` and keeps it stable across visibility", async ({
      page,
    }) => {
      const trigger = page.getByTestId("tooltip-trigger");
      const content = page.getByTestId("tooltip-content");
      const contentId = await content.getAttribute("id");

      await expect(content).toHaveAttribute("role", "tooltip");
      await expect(content).toHaveAttribute("popover", "manual");
      await expect(trigger).toHaveAttribute("type", "button");
      await expect(trigger).toHaveAttribute("aria-describedby", contentId as string);
      // Disclosure-style attrs are intentionally absent: a tooltip is
      // not interactive and is announced via aria-describedby alone.
      await expect(trigger).not.toHaveAttribute("aria-expanded", /.*/);
      await expect(trigger).not.toHaveAttribute("aria-controls", /.*/);

      // aria-describedby is the static contract even while hidden.
      await expect(content).not.toBeVisible();
      await expect(trigger).toHaveAttribute("aria-describedby", /.+/);
    });
  });

  test.describe("Hover", () => {
    test("shows on hover, hides when hover leaves, switches across triggers", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();

      await page.getByTestId("second-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
      await expect(page.getByTestId("second-content")).toBeVisible();

      await page.getByTestId("focus-before").hover();
      await expect(page.getByTestId("second-content")).not.toBeVisible();
    });

    test("does not hide when the pointer enters the tooltip itself (WCAG 1.4.13 Hoverable)", async ({
      page,
    }) => {
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      // Dispatch a pointermove targeted at the tooltip content. The
      // source intentionally ignores pointer events inside tooltip
      // content so the cursor can move across it without dismissing.
      await page.getByTestId("tooltip-content").dispatchEvent("pointermove");
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
    });
  });

  test.describe("Focus", () => {
    test("shows on focus and hides on blur", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.getByTestId("focus-before").focus();
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
    });

    test("hover-shown tooltip does not steal focus from the active element", async ({ page }) => {
      await page.getByTestId("focus-before").focus();
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await expect(page.getByTestId("focus-before")).toBeFocused();
    });

    test("shows when Tab moves focus onto the trigger", async ({ page }) => {
      await page.getByTestId("focus-before").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("tooltip-trigger")).toBeFocused();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
    });
  });

  test.describe("Mixed hover and focus", () => {
    test("hover wins over focus, then unhover falls back to the focused trigger", async ({
      page,
    }) => {
      await page.getByTestId("tooltip-trigger").focus();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();

      await page.getByTestId("second-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
      await expect(page.getByTestId("second-content")).toBeVisible();

      await page.getByTestId("focus-between").hover();
      await expect(page.getByTestId("second-content")).not.toBeVisible();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
    });
  });

  test.describe("Dismissal", () => {
    test("a click on the trigger hides the tooltip (suppression)", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.getByTestId("tooltip-trigger").click();
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
    });

    test("Escape hides without moving focus (WCAG 1.4.13 Dismissable)", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
      await expect(page.getByTestId("tooltip-trigger")).toBeFocused();
    });

    test("suppression lasts until focus leaves and returns to the trigger", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").focus();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
      await page.getByTestId("focus-before").focus();
      await page.getByTestId("tooltip-trigger").focus();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
    });

    test("viewport resize hides the tooltip", async ({ page }) => {
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.setViewportSize({ width: 800, height: 400 });
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
    });

    test("scroll hides the tooltip", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 300 });
      await page.evaluate(() => {
        const div = document.createElement("div");
        div.style.height = "2000px";
        document.body.appendChild(div);
      });
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 200));
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
    });

    test("Escape dismisses the tooltip first and the open menu second", async ({
      page,
      renderer,
    }) => {
      test.skip(renderer !== "html", "Cross-component fixture is plain HTML");
      await page.goto("/html/tooltip/with-menu");
      await page.getByTestId("menu-trigger").click();
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
    });
  });

  test.describe("Disabled", () => {
    test("still shows a tooltip when the trigger is `aria-disabled`", async ({ page }) => {
      await page.getByTestId("disabled-trigger").hover();
      await expect(page.getByTestId("disabled-content")).toBeVisible();
    });
  });

  test.describe("Structure independence", () => {
    test("shows and hides when trigger and content live in different containers", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/tooltip/structure-independence`);
      await page.getByTestId("trigger").hover();
      await expect(page.getByTestId("content")).toBeVisible();
      await page.getByTestId("main").hover();
      await expect(page.getByTestId("content")).not.toBeVisible();
    });
  });

  test.describe("Interaction with other components", () => {
    test("does not block clicks on popover or menu triggers", async ({ page }) => {
      await page.getByTestId("popover-trigger").click();
      await expect(page.getByTestId("popover-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByTestId("menu-trigger").click();
      await expect(page.getByTestId("menu-list")).toBeVisible();
    });

    test("clicking a non-tooltip trigger does not suppress future tooltips", async ({ page }) => {
      await page.getByTestId("popover-trigger").click();
      await page.keyboard.press("Escape");
      await page.getByTestId("tooltip-trigger").hover();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
    });
  });
});

test.describe("Positioning", () => {
  test("publishes the trigger rect and tooltip size as CSS variables on the content", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/tooltip/basic`);
    await page.getByTestId("tooltip-trigger").hover();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();
    const vars = await page
      .getByTestId("tooltip-content")
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
