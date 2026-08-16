import { expect, test } from "./fixtures";
import { scrollAndSettle, setRtl } from "./helpers";

test.describe("Tabs", () => {
  test.describe("ARIA", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
    });

    test("declares the tablist/tab/tabpanel roles", async ({ page }) => {
      await expect(page.getByTestId("tab-1").locator("..")).toHaveAttribute("role", "tablist");
      for (const id of ["tab-1", "tab-2", "tab-3"]) {
        await expect(page.getByTestId(id)).toHaveAttribute("role", "tab");
      }
      for (const id of ["panel-1", "panel-2", "panel-3"]) {
        await expect(page.getByTestId(id)).toHaveAttribute("role", "tabpanel");
      }
    });

    test("links each tab to its panel via `aria-controls`/`aria-labelledby`", async ({ page }) => {
      const tabId = await page.getByTestId("tab-1").getAttribute("id");
      const panelId = await page.getByTestId("panel-1").getAttribute("id");
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-controls", panelId as string);
      await expect(page.getByTestId("panel-1")).toHaveAttribute("aria-labelledby", tabId as string);
    });

    test("moves selection state across the active and inactive tabs", async ({ page }) => {
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("tab-1")).toHaveAttribute("tabindex", "0");
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "false");
      await expect(page.getByTestId("tab-2")).toHaveAttribute("tabindex", "-1");
      await expect(page.getByTestId("tab-3")).toHaveAttribute("tabindex", "-1");
      await expect(page.getByTestId("panel-1")).toHaveAttribute("aria-hidden", "false");
      await expect(page.getByTestId("panel-1")).toHaveAttribute("tabindex", "0");
      await expect(page.getByTestId("panel-2")).toHaveAttribute("aria-hidden", "true");
      await expect(page.getByTestId("panel-2")).toHaveAttribute("tabindex", "-1");
      await expect(page.getByTestId("panel-3")).toHaveAttribute("aria-hidden", "true");
      await expect(page.getByTestId("panel-3")).toHaveAttribute("tabindex", "-1");

      await page.getByTestId("tab-2").click();

      await expect(page.getByTestId("tab-1")).toHaveAttribute("tabindex", "-1");
      await expect(page.getByTestId("tab-2")).toHaveAttribute("tabindex", "0");
      await expect(page.getByTestId("panel-1")).toHaveAttribute("tabindex", "-1");
      await expect(page.getByTestId("panel-2")).toHaveAttribute("tabindex", "0");
    });

    test("publishes `aria-orientation` on the tablist for both layouts", async ({
      page,
      renderer,
    }) => {
      await expect(page.getByTestId("tab-1").locator("..")).toHaveAttribute(
        "aria-orientation",
        "horizontal",
      );
      await page.goto(`/${renderer}/tabs/vertical`);
      await expect(page.getByTestId("vtab-1").locator("..")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
    });
  });

  test.describe("Initial state", () => {
    test("honors `defaultValue` on initial render", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/default-second`);
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("dpanel-2")).toBeVisible();
      await expect(page.getByTestId("dtab-1")).toHaveAttribute("aria-selected", "false");
    });
  });

  // Both orientations share the same navigation contract, just on different
  // axes; one parameterized block covers both. ArrowLeft/Right work for
  // horizontal, ArrowUp/Down for vertical; the off-axis keys are inert.
  for (const layout of [
    {
      name: "horizontal",
      fixture: "tabs/horizontal",
      tabs: ["tab-1", "tab-2", "tab-3"],
      panels: ["panel-1", "panel-2", "panel-3"],
      next: "ArrowRight",
      previous: "ArrowLeft",
      inertNext: "ArrowDown",
      inertPrevious: "ArrowUp",
    },
    {
      name: "vertical",
      fixture: "tabs/vertical",
      tabs: ["vtab-1", "vtab-2", "vtab-3"],
      panels: ["vpanel-1", "vpanel-2", "vpanel-3"],
      next: "ArrowDown",
      previous: "ArrowUp",
      inertNext: "ArrowRight",
      inertPrevious: "ArrowLeft",
    },
  ] as const) {
    test.describe(`Keyboard (${layout.name})`, () => {
      test.beforeEach(async ({ page, renderer }) => {
        await page.goto(`/${renderer}/${layout.fixture}`);
      });

      test(`${layout.next} / ${layout.previous} wrap around the tab list`, async ({ page }) => {
        await page.getByTestId(layout.tabs[0]).focus();
        await page.keyboard.press(layout.next);
        await expect(page.getByTestId(layout.tabs[1])).toBeFocused();
        // Backward navigation from a non-edge position.
        await page.keyboard.press(layout.previous);
        await expect(page.getByTestId(layout.tabs[0])).toBeFocused();
        await page.keyboard.press(layout.next);
        await page.keyboard.press(layout.next);
        await page.keyboard.press(layout.next);
        await expect(page.getByTestId(layout.tabs[0])).toBeFocused();
        await page.keyboard.press(layout.previous);
        await expect(page.getByTestId(layout.tabs[2])).toBeFocused();
      });

      test("Home / End jump to first / last tab", async ({ page }) => {
        await page.getByTestId(layout.tabs[1]).focus();
        await page.keyboard.press("Home");
        await expect(page.getByTestId(layout.tabs[0])).toBeFocused();
        await page.keyboard.press("End");
        await expect(page.getByTestId(layout.tabs[2])).toBeFocused();
      });

      test(`${layout.inertNext} / ${layout.inertPrevious} are inert`, async ({ page }) => {
        await page.getByTestId(layout.tabs[0]).focus();
        await page.keyboard.press(layout.inertNext);
        await expect(page.getByTestId(layout.tabs[0])).toBeFocused();
        await page.keyboard.press(layout.inertPrevious);
        await expect(page.getByTestId(layout.tabs[0])).toBeFocused();
      });

      for (const key of ["Enter", "Space"] as const) {
        test(`${key} activates the focused tab and shows its panel`, async ({ page }) => {
          await page.getByTestId(layout.tabs[1]).focus();
          await page.keyboard.press(key);
          await expect(page.getByTestId(layout.tabs[1])).toHaveAttribute("aria-selected", "true");
          await expect(page.getByTestId(layout.panels[1])).toBeVisible();
        });
      }

      test("arrow keys move focus but do not activate", async ({ page }) => {
        await page.getByTestId(layout.tabs[0]).focus();
        await page.keyboard.press(layout.next);
        await expect(page.getByTestId(layout.tabs[1])).toBeFocused();
        await expect(page.getByTestId(layout.tabs[0])).toHaveAttribute("aria-selected", "true");
        await expect(page.getByTestId(layout.tabs[1])).toHaveAttribute("aria-selected", "false");
        await expect(page.getByTestId(layout.panels[0])).toBeVisible();
      });
    });
  }

  test.describe("Keyboard (RTL)", () => {
    test("ArrowLeft / ArrowRight reverse direction in RTL", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
      await setRtl(page);
      await page.getByTestId("tab-1").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("tab-2")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("tab-1")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("tab-3")).toBeFocused();
    });

    test("vertical arrows are unaffected by RTL", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/vertical`);
      await setRtl(page);
      await page.getByTestId("vtab-1").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("vtab-2")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("vtab-1")).toBeFocused();
    });
  });

  test.describe("Mouse", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
    });

    test("click activates the tab and swaps panel visibility", async ({ page }) => {
      await page.getByTestId("tab-2").click();
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("panel-2")).toBeVisible();
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "false");
      await expect(page.getByTestId("panel-1")).not.toBeVisible();
    });

    test("re-activating the selected tab is a no-op", async ({ page }) => {
      await page.getByTestId("tab-1").click();
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("panel-1")).toBeVisible();

      for (const key of ["Enter", "Space"] as const) {
        await page.getByTestId("tab-1").focus();
        await page.keyboard.press(key);
        await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true");
        await expect(page.getByTestId("panel-1")).toBeVisible();
      }
    });

    test("click on a vertical tab swaps the active panel", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/vertical`);
      await page.getByTestId("vtab-2").click();
      await expect(page.getByTestId("vtab-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("vpanel-2")).toBeVisible();
      await expect(page.getByTestId("vtab-1")).toHaveAttribute("aria-selected", "false");
      await expect(page.getByTestId("vpanel-1")).not.toBeVisible();
    });

    test("activates via a click on a nested SVG inside the tab", async ({ page }) => {
      await page.getByTestId("svg-icon-2").click();
      await expect(page.getByTestId("svg-panel-2")).toBeVisible();
      await expect(page.getByTestId("svg-panel-1")).not.toBeVisible();
    });
  });

  test.describe("Tab order", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
    });

    test("walks Focus before → selected tab → its panel → Focus after", async ({ page }) => {
      await page.getByTestId("focus-before").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("tab-1")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("panel-1")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focus-after")).toBeFocused();
    });

    test("Tab into the tablist lands on the currently selected tab", async ({ page }) => {
      await page.getByTestId("tab-2").click();
      await page.getByTestId("focus-before").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("tab-2")).toBeFocused();
    });

    test("Shift+Tab from the tablist moves to the previous focusable", async ({ page }) => {
      await page.getByTestId("tab-1").focus();
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("focus-before")).toBeFocused();
    });
  });

  test.describe("Edge cases", () => {
    test("a single-tab tablist no-ops on arrow navigation", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/single`);
      const tab = page.getByTestId("single-tab");
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("single-panel")).toBeVisible();
      await tab.focus();
      await tab.press("ArrowRight");
      await expect(tab).toBeFocused();
    });
  });

  test.describe("Scroll prevention", () => {
    for (const [fixture, key, axis] of [
      ["tabs/horizontal", "Space", "y"],
      ["tabs/horizontal", "ArrowRight", "x"],
      ["tabs/vertical", "ArrowDown", "y"],
    ] as const) {
      test(`${key} on a ${fixture.split("/")[1]} tab does not scroll`, async ({
        page,
        renderer,
      }) => {
        await page.goto(`/${renderer}/${fixture}`);
        await page.evaluate((dim) => {
          document.body.style[dim === "y" ? "height" : "width"] = "3000px";
        }, axis);
        if (axis === "y") {
          await scrollAndSettle(page, 0, 500);
        } else {
          await scrollAndSettle(page, 500, 0);
        }
        await page.getByTestId(fixture.includes("vertical") ? "vtab-1" : "tab-1").focus();
        const before = await page.evaluate(
          (d) => (d === "y" ? window.scrollY : window.scrollX),
          axis,
        );
        await page.keyboard.press(key);
        const after = await page.evaluate(
          (d) => (d === "y" ? window.scrollY : window.scrollX),
          axis,
        );
        expect(after).toBe(before);
      });
    }
  });

  test.describe("Disabled", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/disabled`);
    });

    test("publishes `aria-disabled` only on disabled tabs", async ({ page }) => {
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("dtab-1")).not.toHaveAttribute("aria-disabled");
    });

    test("ignores activation via mouse, Enter, and Space", async ({ page }) => {
      await page.getByTestId("dtab-2").click({ force: true });
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "false");
      await expect(page.getByTestId("dpanel-1")).toBeVisible();

      await page.getByTestId("dtab-2").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "false");
      await page.keyboard.press("Space");
      await expect(page.getByTestId("dtab-2")).toHaveAttribute("aria-selected", "false");
    });

    test("skips the disabled tab across all keyboard navigation keys", async ({ page }) => {
      await page.getByTestId("dtab-1").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("dtab-3")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("dtab-1")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByTestId("dtab-3")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.getByTestId("dtab-1")).toBeFocused();
    });
  });

  test.describe("Structure independence", () => {
    test("activates and reveals the matching panel when panels live in a different container from the tablist", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/tabs/structure-independence`);
      await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("panel-1")).toBeVisible();

      await page.getByTestId("tab-2").click();
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("panel-2")).toBeVisible();
      await expect(page.getByTestId("panel-1")).not.toBeVisible();

      await page.getByTestId("tab-1").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("tab-2")).toBeFocused();
    });
  });

  test.describe("Non-focusable panels", () => {
    test.beforeEach(async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/non-focusable`);
    });

    test("omits tabindex on panels when `focusable={false}`", async ({ page }) => {
      for (const id of ["nf-panel-1", "nf-panel-2", "nf-panel-3"]) {
        await expect(page.getByTestId(id)).not.toHaveAttribute("tabindex");
      }
      // Switching tabs must not inject a tabindex on either the new or
      // the old panel.
      await page.getByTestId("nf-tab-2").click();
      await expect(page.getByTestId("nf-panel-2")).not.toHaveAttribute("tabindex");
      await expect(page.getByTestId("nf-panel-1")).not.toHaveAttribute("tabindex");
    });

    test("Tab from the tab lands directly inside focusable panel content", async ({ page }) => {
      await page.getByTestId("nf-tab-1").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("nf-button-1")).toBeFocused();

      await page.getByTestId("nf-tab-2").click();
      await page.getByTestId("nf-tab-2").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("nf-button-2")).toBeFocused();
    });
  });
});

test.describe("Click handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/tabs/horizontal`);
  });

  for (const trigger of ["click", "Enter", "Space"] as const) {
    test(`fires on tab ${trigger}`, async ({ page }) => {
      const target = page.getByTestId("tab-2");
      if (trigger === "click") {
        await target.click();
      } else {
        await target.focus();
        await page.keyboard.press(trigger);
      }
      await expect(page.getByTestId("output")).toHaveText("tab-2-clicked");
    });
  }
});

test.describe("Dynamic", () => {
  test("handles dynamic add/remove, orientation, disabled, multi-instance, and props passthrough", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/tabs/dynamic`);

    await expect(page.getByTestId("tabs-root")).toHaveClass(/tabs-root/);

    await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("panel-1")).toBeVisible();

    await page.getByTestId("tab-2").click();
    await expect(page.getByTestId("output")).toHaveText("tab-2-clicked");
    await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");

    await page.getByTestId("add-tab").click();
    await expect(page.getByTestId("tab-4")).toHaveAttribute("role", "tab");
    await expect(page.getByTestId("panel-4")).toHaveAttribute("role", "tabpanel");
    const tabId = await page.getByTestId("tab-4").getAttribute("id");
    await expect(page.getByTestId("panel-4")).toHaveAttribute("aria-labelledby", tabId as string);
    await page.getByTestId("tab-1").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("tab-4")).toBeFocused();
    await page.getByTestId("tab-4").click();
    await expect(page.getByTestId("panel-4")).toBeVisible();

    await page.getByTestId("remove-tab").click();
    await page.getByTestId("remove-tab").click();
    await page.getByTestId("tab-1").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("tab-2")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("tab-1")).toBeFocused();

    await page.getByTestId("toggle-orientation").click();
    await expect(page.getByTestId("tablist")).toHaveAttribute("aria-orientation", "vertical");
    await page.getByTestId("tab-1").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("tab-2")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("tab-2")).toBeFocused();
    await page.getByTestId("toggle-orientation").click();

    await page.getByTestId("tab-1").click();
    await page.getByTestId("toggle-disabled").click();
    await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("tab-1").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("tab-2")).not.toBeFocused();
    await page.getByTestId("tab-2").click({ force: true });
    await expect(page.getByTestId("tab-2")).not.toHaveAttribute("aria-selected", "true");

    await expect(page.getByTestId("tabs2-tab-1")).toHaveAttribute("aria-selected", "true");
    await page.getByTestId("tabs2-tab-2").click();
    await expect(page.getByTestId("tabs2-tab-2")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("tabs2-panel-2")).toBeVisible();
    await expect(page.getByTestId("tab-1")).toHaveAttribute("aria-selected", "true");
  });
});
