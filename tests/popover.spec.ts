import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { loadSpecCss, setRtl } from "./helpers";

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

    test("toggles `aria-expanded` across the open and close cycle", async ({ page }) => {
      const trigger = page.getByTestId("click-trigger");
      const content = page.getByTestId("click-content");

      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).not.toBeVisible();

      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(content).toBeVisible();
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

  test.describe("Edge cases", () => {
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
  });

  test.describe("Dismissal", () => {
    test("outside click closes the popover", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("focus-before").click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });
  });

  test.describe("Focus management", () => {
    test("opening with the mouse moves focus into content; trigger Tab walks into focusable children", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit click/Tab focus inside a popover");
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

    test("Shift+Tab off the trigger closes the popover", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "WebKit Tab order after popover");
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("click-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("click-content")).not.toBeVisible();
    });
  });

  test.describe("Dismissal (scroll)", () => {
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
  });

  test.describe("Structure independence", () => {
    test("opens, focuses content, and dismisses on outside click when trigger and content live in different containers", async ({
      page,
      renderer,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit click/Tab focus inside a popover");
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

  test.describe("Multiple", () => {
    test("opening another popover closes the first", async ({ page }) => {
      await page.getByTestId("click-trigger").click();
      await page.getByTestId("second-trigger").click();
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("second-content")).toBeVisible();
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

  test.describe("Composition (menu)", () => {
    test.beforeEach(async ({ page, renderer }) => {
      test.skip(renderer !== "html", "Cross-component fixture is plain HTML");
      await page.goto("/html/popover/with-menu");
      await page.getByTestId("popover-trigger").click();
      await expect(page.getByTestId("popover-content")).toBeVisible();
    });

    test("Escape closes a keyboard-opened menu inside the popover first", async ({ page }) => {
      await page.getByTestId("menu-trigger").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await expect(page.getByTestId("menu-item-1")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
      await expect(page.getByTestId("popover-content")).toBeVisible();
      await expect(page.getByTestId("menu-trigger")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("popover-content")).not.toBeVisible();
      await expect(page.getByTestId("popover-trigger")).toBeFocused();
    });

    test("Escape closes a pointer-opened menu inside the popover first", async ({ page }) => {
      await page.getByTestId("menu-trigger").click();
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await expect(page.getByTestId("popover-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
      await expect(page.getByTestId("popover-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("popover-content")).not.toBeVisible();
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
        el.style.getPropertyValue("--mc-trigger-top"),
        el.style.getPropertyValue("--mc-trigger-right"),
        el.style.getPropertyValue("--mc-trigger-bottom"),
        el.style.getPropertyValue("--mc-trigger-left"),
        el.style.getPropertyValue("--mc-content-width"),
        el.style.getPropertyValue("--mc-content-height"),
      ]);
    for (const value of vars) expect(value).toMatch(/^-?\d+(\.\d+)?px$/);
  });

  test("caps content too tall for either side to the viewport, and it scrolls", async ({
    page,
    renderer,
  }) => {
    test.skip(renderer !== "html", "Placement is the spec's CSS, not the renderer");
    await page.setViewportSize({ width: 320, height: 240 });
    await page.goto("/html/popover/tall");
    await loadSpecCss(page, "popover");
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("content")).toBeVisible();
    const content = await page.getByTestId("content").boundingBox();
    if (!content) throw new Error("missing bounding box");
    expect(content.y).toBeGreaterThanOrEqual(0);
    expect(content.y + content.height).toBeLessThanOrEqual(240);
    expect(
      await page.getByTestId("content").evaluate((el) => el.scrollHeight > el.clientHeight),
    ).toBe(true);
    expect(
      await page
        .getByTestId("content")
        .evaluate((el) => el.style.getPropertyValue("--mc-available-height")),
    ).toMatch(/^\d+(\.\d+)?px$/);
  });

  test("viewport resize keeps the popover open and republishes the trigger rect", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/popover/basic`);
    await page.getByTestId("click-trigger").evaluate((el) => {
      el.style.marginLeft = "50vw";
    });
    await page.getByTestId("click-trigger").click();
    await expect(page.getByTestId("click-content")).toBeVisible();
    const left = () =>
      page
        .getByTestId("click-content")
        .evaluate((el) => el.style.getPropertyValue("--mc-trigger-left"));
    const before = await left();
    await page.setViewportSize({ width: 800, height: 400 });
    await expect(page.getByTestId("click-content")).toBeVisible();
    await expect.poll(left).not.toBe(before);
  });
});

test.describe("Placement (spec CSS)", () => {
  test.beforeEach(({ renderer }) => {
    test.skip(renderer !== "html", "Placement is the spec's CSS, not the renderer");
  });

  const open = async (
    page: Page,
    attrs: Record<string, string> = {},
    at: Record<string, string> = { left: "300px", top: "250px" },
  ) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/html/popover/basic");
    await loadSpecCss(page, "popover");
    await page.getByTestId("click-trigger").evaluate((el, style) => {
      Object.assign(el.style, { position: "fixed", ...style });
    }, at);
    await page.getByTestId("click-content").evaluate((el, values) => {
      for (const [name, value] of Object.entries(values)) el.setAttribute(name, value);
    }, attrs);
    await page.getByTestId("click-trigger").click();
    await expect(page.getByTestId("click-content")).toBeVisible();
    const trigger = await page.getByTestId("click-trigger").boundingBox();
    const content = await page.getByTestId("click-content").boundingBox();
    if (!trigger || !content) throw new Error("missing bounding box");
    return { trigger, content };
  };

  test("opens below and centered by default", async ({ page }) => {
    const { trigger, content } = await open(page);
    await expect(page.getByTestId("click-content")).toHaveAttribute("data-mc-y", "bottom");
    await expect(page.getByTestId("click-content")).not.toHaveAttribute("data-mc-x");
    expect(content.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
    expect(Math.abs(content.x + content.width / 2 - (trigger.x + trigger.width / 2))).toBeLessThan(
      1,
    );
  });

  test("`data-mc-side` picks each side", async ({ page }) => {
    let { trigger, content } = await open(page, { "data-mc-side": "top" });
    await expect(page.getByTestId("click-content")).toHaveAttribute("data-mc-y", "top");
    expect(content.y + content.height).toBeLessThanOrEqual(trigger.y);

    ({ trigger, content } = await open(page, { "data-mc-side": "right" }));
    await expect(page.getByTestId("click-content")).toHaveAttribute("data-mc-x", "right");
    await expect(page.getByTestId("click-content")).not.toHaveAttribute("data-mc-y");
    expect(content.x).toBeGreaterThanOrEqual(trigger.x + trigger.width);
    expect(
      Math.abs(content.y + content.height / 2 - (trigger.y + trigger.height / 2)),
    ).toBeLessThan(1);

    ({ trigger, content } = await open(
      page,
      { "data-mc-side": "left" },
      { left: "500px", top: "250px" },
    ));
    await expect(page.getByTestId("click-content")).toHaveAttribute("data-mc-x", "left");
    expect(content.x + content.width).toBeLessThanOrEqual(trigger.x);
  });

  test("`data-mc-align` lines up start and end edges", async ({ page }) => {
    let { trigger, content } = await open(page, { "data-mc-align": "start" });
    expect(Math.abs(content.x - trigger.x)).toBeLessThan(1);
    ({ trigger, content } = await open(page, { "data-mc-align": "end" }));
    expect(Math.abs(content.x + content.width - (trigger.x + trigger.width))).toBeLessThan(1);
    ({ trigger, content } = await open(page, {
      "data-mc-side": "right",
      "data-mc-align": "start",
    }));
    expect(Math.abs(content.y - trigger.y)).toBeLessThan(1);
  });

  test("start lines up the right edges on a right-to-left page", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/html/popover/basic");
    await loadSpecCss(page, "popover");
    await setRtl(page);
    await page.getByTestId("click-trigger").evaluate((el) => {
      Object.assign(el.style, { position: "fixed", left: "300px", top: "250px" });
    });
    await page.getByTestId("click-content").evaluate((el) => {
      el.setAttribute("data-mc-align", "start");
    });
    await page.getByTestId("click-trigger").click();
    const trigger = await page.getByTestId("click-trigger").boundingBox();
    const content = await page.getByTestId("click-content").boundingBox();
    if (!trigger || !content) throw new Error("missing bounding box");
    expect(Math.abs(content.x + content.width - (trigger.x + trigger.width))).toBeLessThan(1);
  });

  test("an authored side flips when it does not fit", async ({ page }) => {
    const { trigger, content } = await open(
      page,
      { "data-mc-side": "top" },
      { left: "300px", top: "0px" },
    );
    await expect(page.getByTestId("click-content")).toHaveAttribute("data-mc-y", "bottom");
    expect(content.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
  });

  test("an unknown side falls back to the default", async ({ page }) => {
    await open(page, { "data-mc-side": "middle" });
    await expect(page.getByTestId("click-content")).toHaveAttribute("data-mc-y", "bottom");
  });
});
