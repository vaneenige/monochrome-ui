import { expect, test } from "./fixtures";
import { pointerDown } from "./helpers";

test.describe("Popover", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/popover/basic`);
  });

  test.describe("ARIA", () => {
    test("declares trigger / content roles and links them via `aria-controls`/`aria-labelledby`", async ({
      page,
    }) => {
      const trigger = page.getByTestId("click-trigger");
      const content = page.getByTestId("click-content");
      const triggerId = await trigger.getAttribute("id");
      const contentId = await content.getAttribute("id");

      await expect(trigger).toHaveAttribute("type", "button");
      await expect(trigger).toHaveAttribute("aria-controls", contentId as string);
      await expect(content).toHaveAttribute("aria-labelledby", triggerId as string);
      await expect(content).toHaveAttribute("popover", "manual");
    });

    test("toggles `aria-expanded` / `aria-hidden` across the open and close cycle", async ({
      page,
    }) => {
      const trigger = page.getByTestId("click-trigger");
      const content = page.getByTestId("click-content");

      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).toHaveAttribute("aria-hidden", "true");

      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(content).toHaveAttribute("aria-hidden", "false");
    });

    test("auto-wires `aria-describedby` from Popover.Description while keeping the trigger as the label", async ({
      page,
    }) => {
      const trigger = page.getByTestId("described-trigger");
      const content = page.getByTestId("described-content");
      const triggerId = await trigger.getAttribute("id");
      const descId = await page.getByTestId("described-desc").getAttribute("id");
      await expect(content).toHaveAttribute("aria-labelledby", triggerId as string);
      await expect(content).toHaveAttribute("aria-describedby", descId as string);
    });

    test("a user-supplied `aria-label` suppresses the default `aria-labelledby`", async ({
      page,
    }) => {
      const content = page.getByTestId("aria-label-content");
      await expect(content).toHaveAttribute("aria-label", "Quick info");
      await expect(content).not.toHaveAttribute("aria-labelledby", /.*/);
    });

    test("passes through `role='dialog'` on a non-modal dialog popover", async ({ page }) => {
      const content = page.getByTestId("dialog-popover-content");
      await expect(content).toHaveAttribute("role", "dialog");
      await expect(content).toHaveAttribute("aria-label", "Filter results");
      await expect(content).not.toHaveAttribute("aria-labelledby", /.*/);
    });
  });

  test.describe("Activation", () => {
    test("opens on click, closes on second click of the trigger", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("click-content")).toBeVisible();
      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });

    for (const key of ["Enter", "Space"] as const) {
      test(`opens via ${key} on the trigger`, async ({ page }) => {
        await page.getByTestId("click-trigger").focus();
        await page.keyboard.press(key);
        await expect(page.getByTestId("click-content")).toBeVisible();
      });
    }

    test("Escape closes and returns focus to the trigger", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("click-trigger")).toBeFocused();
    });

    test("ignores `aria-disabled` triggers via mouse and keyboard", async ({ page }) => {
      await page.getByTestId("disabled-trigger").click({ force: true });
      await expect(page.getByTestId("disabled-content")).not.toBeVisible();
      await page.getByTestId("disabled-trigger").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("disabled-content")).not.toBeVisible();
    });

    test("activates via a click on a nested SVG inside the trigger", async ({ page }) => {
      const svg = page.getByTestId("svg-icon");
      await svg.click();
      await expect(page.getByTestId("click-content")).toBeVisible();
      await svg.click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });
  });

  test.describe("Content interaction", () => {
    test("clicks inside content do not close the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("click-text").click();
      await expect(page.getByTestId("click-content")).toBeVisible();
    });

    test("interactive children fire their own click handlers", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("copy-button").click();
      await expect(page.getByTestId("output")).toHaveText("copy-clicked");
      await expect(page.getByTestId("click-content")).toBeVisible();
    });

    test("outside click closes the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("focus-before").click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });

    test("pointerdown outside dismisses the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await pointerDown(page.getByTestId("focus-before"));
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });

    test("non-primary pointerdown outside does not dismiss the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await pointerDown(page.getByTestId("focus-before"), { button: 2 });
      await expect(page.getByTestId("click-content")).toBeVisible();
    });

    test("pointerdown inside content does not dismiss the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await pointerDown(page.getByTestId("click-text"));
      await expect(page.getByTestId("click-content")).toBeVisible();
    });

    test("pointerdown on the open trigger does not dismiss before click", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await pointerDown(page.getByTestId("click-trigger"));
      await expect(page.getByTestId("click-content")).toBeVisible();
    });
  });

  test.describe("Focus management", () => {
    test("opening with the mouse moves focus into content; trigger Tab walks into focusable children", async ({
      page,
    }) => {
      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("click-content")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("copy-button")).toBeFocused();
    });

    test("closing via trigger click returns focus to the trigger", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("click-trigger")).toBeFocused();
    });

    test("Escape from a focused child returns focus to the trigger", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("copy-button").focus();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("click-trigger")).toBeFocused();
    });

    test("Tab past the last focusable child closes the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("copy-button").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });

    test("Shift+Tab off the trigger closes the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("click-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });

    test("focusout without a relatedTarget does not dismiss the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("click-content").dispatchEvent("focusout", { relatedTarget: null });
      await expect(page.getByTestId("click-content")).toBeVisible();
    });
  });

  test.describe("Dismissal", () => {
    test("dismisses on page scroll", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 300 });
      await page.evaluate(() => {
        const div = document.createElement("div");
        div.style.height = "2000px";
        document.body.appendChild(div);
      });
      await page.getByTestId("click-trigger").click();
      await page.evaluate(() => window.scrollTo(0, 200));
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });

    test("stays open when a scrollable child inside content scrolls", async ({ page }) => {
      await page.getByTestId("scroll-trigger").click();
      await page.getByTestId("scroll-inner").evaluate((el) => {
        el.scrollTop = 50;
      });
      await expect(page.getByTestId("scroll-content")).toBeVisible();
    });

    test("viewport resize closes the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("click-content")).toBeVisible();
      await page.setViewportSize({ width: 800, height: 400 });
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });
  });

  test.describe("Structure independence", () => {
    test("opens, focuses content, and dismisses on outside click when trigger and content live in different containers", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/popover/structure-independence`);
      await page.getByTestId("trigger").click();
      await expect(page.getByTestId("content")).toBeVisible();
      await expect(page.getByTestId("content")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("inside")).toBeFocused();
      // Clicking unrelated chrome that sits between trigger and content
      // in DOM order is just an outside click.
      await page.getByTestId("main").click();
      await expect(page.getByTestId("content")).not.toBeVisible();
    });
  });

  test.describe("Mutual exclusion", () => {
    test("opening another popover closes the first", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("second-trigger").click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("second-content")).toBeVisible();
    });

    test("clicking a disabled trigger dismisses the open popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("click-content")).toBeVisible();
      await page.getByTestId("disabled-trigger").click({ force: true });
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("disabled-content")).not.toBeVisible();
    });

    test("popover and menu close each other on open", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("menu-trigger").click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("menu-list")).toBeVisible();

      await page.getByTestId("click-trigger").click();
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
      await expect(page.getByTestId("click-content")).toBeVisible();
    });
  });
});

test.describe("Click handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/popover/basic`);
  });

  for (const trigger of ["click", "Enter", "Space"] as const) {
    test(`fires on trigger ${trigger}`, async ({ page }) => {
      const target = page.getByTestId("click-trigger");
      if (trigger === "click") {
        await target.click();
      } else {
        await target.focus();
        await page.keyboard.press(trigger);
      }
      await expect(page.getByTestId("output")).toHaveText("trigger-clicked");
    });
  }
});

test.describe("Positioning", () => {
  test("publishes the trigger rect and panel size as CSS variables on the content", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/popover/basic`);
    await page.getByTestId("click-trigger").click();
    await expect(page.getByTestId("click-content")).toBeVisible();
    const vars = await page
      .getByTestId("click-content")
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
