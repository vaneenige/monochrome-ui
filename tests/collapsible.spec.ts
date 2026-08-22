import { expect, test } from "./fixtures";
import { scrollAndSettle } from "./helpers";

test.describe("Collapsible", () => {
  test.describe("ARIA", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
    });

    test("wires trigger and panel via `aria-controls`/`aria-labelledby`", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger");
      const content = page.getByTestId("collapsible-content");
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
      const trigger = page.getByTestId("collapsible-trigger");
      const content = page.getByTestId("collapsible-content");

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
  });

  test.describe("Initial state", () => {
    test("respects the `open` prop on initial render", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/open`);
      await expect(page.getByTestId("open-collapsible-content")).toBeVisible();
      await expect(page.getByTestId("open-collapsible-trigger")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.getByTestId("open-collapsible-trigger").click();
      await expect(page.getByTestId("open-collapsible-content")).not.toBeVisible();
    });
  });

  test.describe("Activation", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
    });

    for (const key of ["Enter", "Space"] as const) {
      test(`toggles via ${key} and keeps focus on the trigger`, async ({ page }) => {
        const trigger = page.getByTestId("collapsible-trigger");
        const content = page.getByTestId("collapsible-content");
        await trigger.focus();
        await trigger.press(key);
        await expect(content).toBeVisible();
        await expect(trigger).toBeFocused();
        await trigger.press(key);
        await expect(content).not.toBeVisible();
        await expect(trigger).toBeFocused();
      });
    }

    test("toggles via mouse click and keeps focus on the trigger", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger");
      const content = page.getByTestId("collapsible-content");
      await trigger.click();
      await expect(content).toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(content).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });

    test("activates via a click on a nested SVG inside the trigger", async ({ page }) => {
      const svg = page.getByTestId("svg-icon");
      const content = page.getByTestId("collapsible-content");
      await svg.click();
      await expect(content).toBeVisible();
      await svg.click();
      await expect(content).not.toBeVisible();
    });

    test("Tab walks focus-before → trigger → focus-after", async ({ page }) => {
      await page.getByTestId("focus-before").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("collapsible-trigger")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focus-after")).toBeFocused();
    });
  });

  test.describe("Keyboard inertness", () => {
    test("Arrow keys do not move focus off the trigger", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/multiple`);
      const trigger = page.getByTestId("multi-trigger-1");
      await trigger.focus();
      await trigger.press("ArrowDown");
      await expect(trigger).toBeFocused();
      await trigger.press("ArrowUp");
      await expect(trigger).toBeFocused();
    });
  });

  test.describe("Focus management", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/focusable`);
    });

    test("Tab walks the trigger then continues into focusable panel content", async ({ page }) => {
      await page.getByTestId("focusable-trigger").click();
      await page.getByTestId("focusable-trigger").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focusable-input")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focusable-link")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focusable-button")).toBeFocused();
    });

    test("closed panel content is excluded from the tab order", async ({ page }) => {
      await page.getByTestId("focusable-trigger").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focusable-input")).not.toBeFocused();
    });

    test("clicks inside the open panel do not collapse it", async ({ page }) => {
      await page.getByTestId("rich-trigger").click();
      await page.getByTestId("rich-content-button").click();
      await expect(page.getByTestId("rich-content")).toBeVisible();
    });

    test("closing the panel hides content that previously held focus", async ({ page }) => {
      const trigger = page.getByTestId("focusable-trigger");
      await trigger.click();
      await page.getByTestId("focusable-input").focus();
      await trigger.click();
      await expect(page.getByTestId("focusable-content")).not.toBeVisible();
    });
  });

  test.describe("Disabled", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/disabled`);
    });

    test("publishes `aria-disabled` on a disabled trigger", async ({ page }) => {
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    test("ignores activation via mouse, Enter, and Space", async ({ page }) => {
      const trigger = page.getByTestId("collapsible-trigger");
      const content = page.getByTestId("collapsible-content");
      await trigger.click({ force: true });
      await expect(content).not.toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await trigger.focus();
      await trigger.press("Enter");
      await expect(content).not.toBeVisible();
      await trigger.press("Space");
      await expect(content).not.toBeVisible();
    });
  });

  test.describe("Multiple", () => {
    test("operate independently", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/multiple`);
      await page.getByTestId("multi-trigger-1").click();
      await page.getByTestId("multi-trigger-2").click();
      await expect(page.getByTestId("multi-content-1")).toBeVisible();
      await expect(page.getByTestId("multi-content-2")).toBeVisible();
      await page.getByTestId("multi-trigger-1").click();
      await expect(page.getByTestId("multi-content-1")).not.toBeVisible();
      await expect(page.getByTestId("multi-content-2")).toBeVisible();
    });
  });

  test.describe("Nested", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/nested`);
    });

    test("inner state survives collapsing and re-opening the outer", async ({ page }) => {
      await page.getByTestId("outer-trigger").click();
      await page.getByTestId("inner-trigger").click();
      await expect(page.getByTestId("inner-content")).toBeVisible();

      await page.getByTestId("outer-trigger").click();
      await expect(page.getByTestId("outer-content")).not.toBeVisible();

      await page.getByTestId("outer-trigger").click();
      await expect(page.getByTestId("inner-content")).toBeVisible();
    });

    test("inner closes without affecting outer", async ({ page }) => {
      await page.getByTestId("outer-trigger").click();
      await page.getByTestId("inner-trigger").click();
      await page.getByTestId("inner-trigger").click();
      await expect(page.getByTestId("outer-content")).toBeVisible();
      await expect(page.getByTestId("inner-content")).not.toBeVisible();
    });
  });

  test.describe("Structure independence", () => {
    test("toggles content placed in a different DOM subtree from the trigger", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/collapsible/separated`);
      const trigger = page.getByTestId("separated-trigger");
      const content = page.getByTestId("separated-content");
      await trigger.click();
      await expect(content).toBeVisible();
      await expect(content).toHaveAttribute("aria-hidden", "false");
      await trigger.press("Enter");
      await expect(content).not.toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  test.describe("Edge cases", () => {
    test("a missing `aria-controls` is a no-op", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
      const trigger = page.getByTestId("collapsible-trigger");
      await trigger.evaluate((el) => el.removeAttribute("aria-controls"));
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByTestId("collapsible-content")).not.toBeVisible();
    });
  });

  test.describe("Scroll prevention", () => {
    test("Space on the trigger does not scroll the page", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
      await page.evaluate(() => {
        document.body.style.height = "3000px";
      });
      await scrollAndSettle(page, 0, 500);
      await page.getByTestId("collapsible-trigger").focus();
      const before = await page.evaluate(() => window.scrollY);
      await page.keyboard.press("Space");
      const after = await page.evaluate(() => window.scrollY);
      expect(after).toBe(before);
    });
  });

  test.describe("React", () => {
    test("`ref` attaches to the trigger host", async ({ page, renderer }) => {
      test.skip(renderer !== "react", "Ref as a prop is a React wrapper API");
      await page.goto("/react/collapsible/ref");
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "data-ref-attached",
        "true",
      );
    });
  });
});

test.describe("Click handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/collapsible/basic`);
  });

  for (const trigger of ["click", "Enter", "Space"] as const) {
    test(`fires on trigger ${trigger}`, async ({ page }) => {
      const target = page.getByTestId("collapsible-trigger");
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
  test("handles conditional render, open prop, remount, multi-instance, and props passthrough", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/collapsible/dynamic`);

    await expect(page.getByTestId("collapsible-root")).toHaveClass(/collapsible-root/);

    await expect(page.getByTestId("content")).not.toBeVisible();
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("output")).toHaveText("trigger-clicked");
    await expect(page.getByTestId("content")).toBeVisible();
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("content")).not.toBeVisible();

    await page.getByTestId("toggle-mount").click();
    await expect(page.getByTestId("trigger")).not.toBeVisible();
    await page.getByTestId("toggle-mount").click();
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("content")).toBeVisible();
    await page.getByTestId("trigger").click();

    await page.getByTestId("toggle-open").click();
    await expect(page.getByTestId("trigger")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("content")).toBeVisible();

    await page.getByTestId("collapsible2-trigger").click();
    await expect(page.getByTestId("collapsible2-content")).toBeVisible();
    await expect(page.getByTestId("content")).toBeVisible();
    await page.getByTestId("collapsible2-trigger").click();
    await expect(page.getByTestId("collapsible2-content")).not.toBeVisible();
  });
});
