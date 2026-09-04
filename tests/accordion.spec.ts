import { expect, test } from "./fixtures";
import { scrollAndSettle } from "./helpers";

test.describe("Accordion", () => {
  test.describe("ARIA", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/single`);
    });

    test("wires trigger and panel via `aria-controls`/`aria-labelledby`", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1");
      const content = page.getByTestId("single-content-1");
      const triggerId = await trigger.getAttribute("id");
      const contentId = await content.getAttribute("id");

      await expect(trigger).toHaveAttribute("aria-controls", contentId as string);
      await expect(content).toHaveAttribute("aria-labelledby", triggerId as string);
      await expect(trigger).toHaveAttribute("type", "button");
      await expect(content).not.toHaveAttribute("role");
    });

    test("toggles `aria-expanded` / `aria-hidden` across the open and close cycle", async ({
      page,
    }) => {
      const trigger = page.getByTestId("single-trigger-1");
      const content = page.getByTestId("single-content-1");

      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).toHaveAttribute("aria-hidden", "true");
      await expect(content).not.toBeVisible();

      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(content).toHaveAttribute("aria-hidden", "false");
      await expect(content).toBeVisible();

      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).toHaveAttribute("aria-hidden", "true");
      await expect(content).not.toBeVisible();
    });

    test("wraps the trigger in a heading: default h3, customisable via the `as` prop", async ({
      page,
    }) => {
      const defaultHeading = page.getByTestId("single-trigger-1").locator("..");
      const customHeading = page.getByTestId("single-trigger-3").locator("..");
      await expect(defaultHeading).toHaveJSProperty("tagName", "H3");
      await expect(customHeading).toHaveJSProperty("tagName", "H2");
    });
  });

  test.describe("Initial state", () => {
    test("respects the `open` prop on initial render", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/default-open`);
      await expect(page.getByTestId("default-content-2")).toBeVisible();
      await expect(page.getByTestId("default-trigger-2")).toHaveAttribute("aria-expanded", "true");
      await page.getByTestId("default-trigger-2").click();
      await expect(page.getByTestId("default-content-2")).not.toBeVisible();
    });
  });

  test.describe("Activation", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/single`);
    });

    for (const key of ["Enter", "Space"] as const) {
      test(`toggles the panel on ${key} and keeps focus on the trigger`, async ({ page }) => {
        const trigger = page.getByTestId("single-trigger-1");
        const content = page.getByTestId("single-content-1");
        await trigger.focus();
        await trigger.press(key);
        await expect(content).toBeVisible();
        await expect(trigger).toBeFocused();
        await trigger.press(key);
        await expect(content).not.toBeVisible();
        await expect(trigger).toBeFocused();
      });
    }

    test("toggles via mouse click and keeps focus on the trigger", async ({
      page,
      browserName,
    }) => {
      const trigger = page.getByTestId("single-trigger-1");
      const content = page.getByTestId("single-content-1");
      await trigger.click();
      await expect(content).toBeVisible();
      if (browserName !== "webkit") await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(content).not.toBeVisible();
      if (browserName !== "webkit") await expect(trigger).toBeFocused();
    });

    test("activates via a click on a nested SVG inside the trigger", async ({ page }) => {
      const svg = page.getByTestId("svg-icon-1");
      const content = page.getByTestId("single-content-1");
      await svg.click();
      await expect(content).toBeVisible();
      await svg.click();
      await expect(content).not.toBeVisible();
    });

    test("does not close when an interactive descendant in the panel is clicked", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/accordion/rich-content`);
      await page.getByTestId("rich-trigger-1").click();
      await page.getByTestId("rich-button").click();
      await expect(page.getByTestId("rich-content-1")).toBeVisible();
    });

    test("opening a new item closes the previously open one", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click();
      await expect(page.getByTestId("single-content-1")).toBeVisible();
      await page.getByTestId("single-trigger-2").click();
      await expect(page.getByTestId("single-content-1")).not.toBeVisible();
      await expect(page.getByTestId("single-content-2")).toBeVisible();
    });

    test("keyboard activation also closes the previously open item", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("single-content-1")).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("single-trigger-2")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("single-content-2")).toBeVisible();
      await expect(page.getByTestId("single-content-1")).not.toBeVisible();
    });

    test("supports closing all items", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-1");
      await trigger.click();
      await trigger.click();
      for (const id of ["single-content-1", "single-content-2", "single-content-3"]) {
        await expect(page.getByTestId(id)).not.toBeVisible();
      }
    });
  });

  test.describe("Keyboard navigation", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/single`);
    });

    test("ArrowDown / ArrowUp wrap around the trigger list", async ({ page }) => {
      await page.getByTestId("single-trigger-1").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("single-trigger-2")).toBeFocused();
      // Backward navigation from a non-edge position.
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("single-trigger-1")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("single-trigger-1")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("single-trigger-3")).toBeFocused();
    });

    test("Home / End jump to first / last trigger", async ({ page }) => {
      await page.getByTestId("single-trigger-2").focus();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("single-trigger-1")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByTestId("single-trigger-3")).toBeFocused();
    });

    test("ArrowLeft / ArrowRight are inert on the trigger", async ({ page }) => {
      const trigger = page.getByTestId("single-trigger-2");
      await trigger.focus();
      await trigger.press("ArrowLeft");
      await expect(trigger).toBeFocused();
      await trigger.press("ArrowRight");
      await expect(trigger).toBeFocused();
    });

    test("Tab walks every trigger and continues into focusable panel content", async ({
      page,
      renderer,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit Tab order after disclosure");
      await page.getByTestId("focus-before").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("single-trigger-1")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("single-trigger-2")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("single-trigger-3")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focus-after")).toBeFocused();

      await page.goto(`/${renderer}/accordion/rich-content`);
      await page.getByTestId("rich-trigger-1").click();
      await page.getByTestId("rich-trigger-1").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("rich-input")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("rich-button")).toBeFocused();
    });

    test("navigates with arrows regardless of the open / closed state", async ({ page }) => {
      await page.getByTestId("single-trigger-1").click();
      await page.getByTestId("single-trigger-1").focus();
      await page.getByTestId("single-trigger-1").press("ArrowDown");
      await expect(page.getByTestId("single-trigger-2")).toBeFocused();
    });
  });

  test.describe("Nested", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/nested`);
    });

    test("preserves inner state across outer collapse and re-open", async ({ page }) => {
      await page.getByTestId("outer-trigger-1").click();
      await page.getByTestId("nested-trigger-1").click();
      await expect(page.getByTestId("nested-content-1")).toBeVisible();

      await page.getByTestId("outer-trigger-1").click();
      await expect(page.getByTestId("outer-content-1")).not.toBeVisible();

      await page.getByTestId("outer-trigger-1").click();
      await expect(page.getByTestId("nested-content-1")).toBeVisible();
    });

    test("navigates the inner accordion independently of the outer one", async ({ page }) => {
      await page.getByTestId("outer-trigger-1").click();
      await page.getByTestId("nested-trigger-1").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("nested-trigger-2")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("nested-trigger-1")).toBeFocused();
    });
  });

  test.describe("Edge cases", () => {
    test("a single-item accordion no-ops on arrow navigation", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/single-item`);
      const trigger = page.getByTestId("only-trigger");
      const content = page.getByTestId("only-content");
      await trigger.click();
      await expect(content).toBeVisible();
      await trigger.click();
      await expect(content).not.toBeVisible();
      await trigger.focus();
      await trigger.press("ArrowDown");
      await expect(trigger).toBeFocused();
      await trigger.press("ArrowUp");
      await expect(trigger).toBeFocused();
    });
  });

  test.describe("Scroll prevention", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/single`);
      await page.evaluate(() => {
        document.body.style.height = "3000px";
      });
    });

    for (const key of ["Space", "ArrowDown"] as const) {
      test(`does not scroll the page when ${key} is pressed on the trigger`, async ({ page }) => {
        await page.getByTestId("single-trigger-1").focus();
        await scrollAndSettle(page, 0, 500);
        const before = await page.evaluate(() => window.scrollY);
        await page.keyboard.press(key);
        const after = await page.evaluate(() => window.scrollY);
        expect(after).toBe(before);
      });
    }

    test("ArrowLeft / ArrowRight on a trigger do not scroll the page sideways", async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.body.style.width = "3000px";
      });
      await page.getByTestId("single-trigger-1").focus();
      await scrollAndSettle(page, 500, 0);
      const before = await page.evaluate(() => window.scrollX);
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
      expect(await page.evaluate(() => window.scrollX)).toBe(before);
      await expect(page.getByTestId("single-trigger-1")).toBeFocused();
    });
  });

  test.describe("Disabled", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/disabled`);
    });

    test("publishes `aria-disabled` only on disabled triggers", async ({ page }) => {
      await expect(page.getByTestId("disabled-trigger-2")).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("disabled-trigger-1")).not.toHaveAttribute("aria-disabled");
    });

    test("ignores activation via mouse, Enter, and Space", async ({ page }) => {
      const trigger = page.getByTestId("disabled-trigger-2");
      const content = page.getByTestId("disabled-content-2");
      await trigger.click({ force: true });
      await expect(content).not.toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await trigger.focus();
      await trigger.press("Enter");
      await expect(content).not.toBeVisible();
      await trigger.press("Space");
      await expect(content).not.toBeVisible();
    });

    test("skips the disabled trigger across all keyboard navigation keys", async ({ page }) => {
      await page.getByTestId("disabled-trigger-1").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("disabled-trigger-3")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("disabled-trigger-1")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByTestId("disabled-trigger-3")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("disabled-trigger-1")).toBeFocused();
    });

    test("lets enabled items still toggle", async ({ page }) => {
      await page.getByTestId("disabled-trigger-1").click();
      await expect(page.getByTestId("disabled-content-1")).toBeVisible();
      await page.getByTestId("disabled-trigger-3").click();
      await expect(page.getByTestId("disabled-content-3")).toBeVisible();
      await expect(page.getByTestId("disabled-content-1")).not.toBeVisible();
    });

    test("ArrowDown does not scroll when every trigger is disabled", async ({ page }) => {
      await page.evaluate(() => {
        document.body.style.height = "3000px";
        for (const id of ["disabled-trigger-1", "disabled-trigger-2", "disabled-trigger-3"]) {
          const el = document.querySelector(`[data-testid="${id}"]`);
          if (el instanceof HTMLElement) el.ariaDisabled = "true";
        }
      });
      await page.getByTestId("disabled-trigger-1").focus();
      await scrollAndSettle(page, 0, 500);
      const before = await page.evaluate(() => window.scrollY);
      await page.keyboard.press("ArrowDown");
      expect(await page.evaluate(() => window.scrollY)).toBe(before);
      await expect(page.getByTestId("disabled-trigger-1")).toBeFocused();
    });
  });

  test.describe("Structure independence", () => {
    test("toggles without a heading and stays exclusive", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/structure-independence`);
      await page.getByTestId("bare-trigger").click();
      await expect(page.getByTestId("bare-content")).toBeVisible();
      await page.getByTestId("h4-trigger").click();
      await expect(page.getByTestId("h4-content")).toBeVisible();
      await expect(page.getByTestId("bare-content")).not.toBeVisible();
    });

    test("ArrowDown moves from a bare trigger to an `h4` Header", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/structure-independence`);
      await page.getByTestId("bare-trigger").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("h4-trigger")).toBeFocused();
    });
  });
});

test.describe("Click handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/accordion/single`);
  });

  for (const trigger of ["click", "Enter", "Space"] as const) {
    test(`fires on trigger ${trigger}`, async ({ page }) => {
      const target = page.getByTestId("single-trigger-1");
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

test.describe("Dynamic", () => {
  test("handles dynamic items, disabled, multi-instance, and props passthrough", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/accordion/dynamic`);

    await expect(page.getByTestId("accordion-root")).toHaveClass(/accordion-root/);

    await page.getByTestId("trigger-1").click();
    await expect(page.getByTestId("output")).toHaveText("trigger-1-clicked");
    await expect(page.getByTestId("content-1")).toBeVisible();
    await page.getByTestId("trigger-2").click();
    await expect(page.getByTestId("content-2")).toBeVisible();
    await expect(page.getByTestId("content-1")).not.toBeVisible();
    await page.getByTestId("trigger-2").click();

    await page.getByTestId("add-item").click();
    await page.getByTestId("trigger-1").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("trigger-4")).toBeFocused();
    await page.getByTestId("trigger-4").click();
    await expect(page.getByTestId("content-4")).toBeVisible();
    await page.getByTestId("trigger-4").click();

    await page.getByTestId("toggle-disabled").click();
    await page.getByTestId("trigger-1").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("trigger-3")).toBeFocused();
    await page.getByTestId("trigger-2").click({ force: true });
    await expect(page.getByTestId("content-2")).not.toBeVisible();

    await page.getByTestId("toggle-disabled").click();
    await page.getByTestId("trigger-1").click();
    await page.getByTestId("trigger-2").click();
    await expect(page.getByTestId("content-1")).not.toBeVisible();
    await expect(page.getByTestId("content-2")).toBeVisible();

    await page.getByTestId("accordion2-trigger-1").click();
    await expect(page.getByTestId("accordion2-content-1")).toBeVisible();
    await expect(page.getByTestId("content-2")).toBeVisible();
    await page.getByTestId("accordion2-trigger-2").click();
    await expect(page.getByTestId("accordion2-content-2")).toBeVisible();
    await expect(page.getByTestId("accordion2-content-1")).not.toBeVisible();
  });
});
