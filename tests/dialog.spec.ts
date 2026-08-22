import { expect, test } from "./fixtures";

test.describe("Dialog", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
  });

  test.describe("ARIA", () => {
    test("declares the modern dialog contract on trigger and content", async ({ page }) => {
      const trigger = page.getByTestId("primary-trigger");
      const content = page.getByTestId("primary-content");
      const contentId = await content.getAttribute("id");

      await expect(trigger).toHaveAttribute("type", "button");
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await expect(trigger).toHaveAttribute("aria-controls", contentId as string);
      // Disclosure pattern attrs do not apply to a modal opened via
      // showModal(); aria-modal is implied by the native <dialog>.
      await expect(trigger).not.toHaveAttribute("aria-expanded", /.*/);
      await expect(content).toHaveJSProperty("tagName", "DIALOG");
      await expect(content).not.toHaveAttribute("aria-modal", /.*/);
      await expect(content).not.toHaveAttribute("popover", /.*/);
    });

    test("auto-wires `aria-labelledby` and `aria-describedby` from Title and Description", async ({
      page,
    }) => {
      await page.getByTestId("primary-trigger").click();
      const titleId = await page.getByTestId("primary-title").getAttribute("id");
      const descId = await page.getByTestId("primary-desc").getAttribute("id");
      await expect(page.getByTestId("primary-content")).toHaveAttribute(
        "aria-labelledby",
        titleId as string,
      );
      await expect(page.getByTestId("primary-content")).toHaveAttribute(
        "aria-describedby",
        descId as string,
      );
    });

    test("a user-supplied `aria-label` suppresses the default `aria-labelledby`", async ({
      page,
    }) => {
      const content = page.getByTestId("bare-content");
      await expect(content).toHaveAttribute("aria-label", "Quick choice");
      await expect(content).not.toHaveAttribute("aria-labelledby", /.*/);
    });

    test("passes through `role='alertdialog'` on Content", async ({ page }) => {
      await expect(page.getByTestId("alert-content")).toHaveAttribute("role", "alertdialog");
    });
  });

  test.describe("Opening", () => {
    test("opens on click, Enter, or Space and reflects dialog.open", async ({ page }) => {
      for (const action of ["click", "Enter", "Space"] as const) {
        if (action === "click") {
          await page.getByTestId("primary-trigger").click();
        } else {
          await page.getByTestId("primary-trigger").focus();
          await page.keyboard.press(action);
        }
        await expect(page.getByTestId("primary-content")).toBeVisible();
        const open = await page
          .getByTestId("primary-content")
          .evaluate((el) => (el as HTMLDialogElement).open);
        expect(open).toBe(true);
        await page.keyboard.press("Escape");
        await expect(page.getByTestId("primary-content")).not.toBeVisible();
      }
    });

    test("ignores `aria-disabled` triggers", async ({ page }) => {
      await page.getByTestId("disabled-trigger").click({ force: true });
      await expect(page.getByTestId("disabled-content")).not.toBeVisible();
    });

    test("opens via a click on a nested SVG inside the trigger", async ({ page }) => {
      await page.getByTestId("svg-icon").click();
      await expect(page.getByTestId("primary-content")).toBeVisible();
    });
  });

  test.describe("Modality", () => {
    test("blocks interaction with background content while open", async ({ page }) => {
      await page.getByTestId("primary-trigger").click();
      await page
        .getByTestId("focus-before")
        .click({ force: true, timeout: 100 })
        .catch(() => {});
      const inside = await page
        .getByTestId("primary-content")
        .evaluate((el) => el.contains(document.activeElement));
      expect(inside).toBe(true);
    });

    test("does not dismiss on backdrop click, scroll, or content click", async ({ page }) => {
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("primary-content")).toBeVisible();

      // Backdrop click lands on the <dialog> itself; we ignore it.
      await page.mouse.click(5, 5);
      await expect(page.getByTestId("primary-content")).toBeVisible();

      await page.setViewportSize({ width: 800, height: 300 });
      await page.evaluate(() => {
        const div = document.createElement("div");
        div.style.height = "2000px";
        document.body.appendChild(div);
      });
      await page.evaluate(() => window.scrollTo(0, 200));
      await expect(page.getByTestId("primary-content")).toBeVisible();

      await page.getByTestId("primary-title").click();
      await expect(page.getByTestId("primary-content")).toBeVisible();
    });
  });

  test.describe("Closing", () => {
    test("closes via Close button (mouse and keyboard) and via Escape", async ({ page }) => {
      await page.getByTestId("primary-trigger").click();
      await page.getByTestId("primary-close").click();
      await expect(page.getByTestId("primary-content")).not.toBeVisible();

      await page.getByTestId("primary-trigger").click();
      await page.getByTestId("primary-close").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("primary-content")).not.toBeVisible();

      await page.getByTestId("primary-trigger").click();
      await page.getByTestId("primary-close").focus();
      await page.keyboard.press("Space");
      await expect(page.getByTestId("primary-content")).not.toBeVisible();

      await page.getByTestId("primary-trigger").click();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("primary-content")).not.toBeVisible();
      const open = await page
        .getByTestId("primary-content")
        .evaluate((el) => (el as HTMLDialogElement).open);
      expect(open).toBe(false);
    });
  });

  test.describe("Focus management", () => {
    test("focuses the first focusable element when no autofocus is set", async ({ page }) => {
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("primary-close")).toBeFocused();
    });

    test("honors the autofocus attribute", async ({ page }) => {
      await page.getByTestId("autofocus-trigger").click();
      await expect(page.getByTestId("autofocus-target")).toBeFocused();
    });

    test("lands inside the dialog even when only Close is focusable", async ({ page }) => {
      await page.getByTestId("bare-trigger").click();
      const inside = await page
        .getByTestId("bare-content")
        .evaluate((el) => el.contains(document.activeElement));
      expect(inside).toBe(true);
    });

    test("background content is unreachable from within the dialog", async ({ page }) => {
      await page.getByTestId("primary-trigger").click();
      await page.getByTestId("primary-action").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("focus-after")).not.toBeFocused();
    });

    test("returns focus to the trigger on close", async ({ page }) => {
      await page.getByTestId("primary-trigger").click();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("primary-trigger")).toBeFocused();
    });
  });

  test.describe("Tabs inside dialog", () => {
    test("initial tab order reflects the selected tab and excludes inactive panel content", async ({
      page,
    }) => {
      await page.getByTestId("tabs-dialog-trigger").click();
      await expect(page.getByTestId("tabs-dialog-close")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("t1-trigger")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("t1-input")).toBeFocused();

      await page.getByTestId("t2-trigger").click();
      await page.getByTestId("tabs-dialog-close").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("t2-trigger")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("t2-link")).toBeFocused();
      await expect(page.getByTestId("t1-input")).not.toBeFocused();
    });
  });

  test.describe("Structure independence", () => {
    test("opens, focuses inside, and closes when trigger and content live in different containers", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/dialog/structure-independence`);
      await page.getByTestId("trigger").click();
      await expect(page.getByTestId("content")).toBeVisible();
      await expect(page.getByTestId("close")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("content")).not.toBeVisible();
      await expect(page.getByTestId("trigger")).toBeFocused();
    });
  });

  test.describe("Overlay stacking", () => {
    test("opening the dialog dismisses any open popover, menu, or tooltip", async ({ page }) => {
      await page.getByTestId("popover-trigger").click();
      await expect(page.getByTestId("popover-content")).toBeVisible();
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("popover-content")).not.toBeVisible();
      await page.keyboard.press("Escape");

      await page.getByTestId("menu-trigger").click();
      await expect(page.getByTestId("menu-list")).toBeVisible();
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("menu-list")).not.toBeVisible();
      await page.keyboard.press("Escape");

      await page.getByTestId("tooltip-trigger").focus();
      await expect(page.getByTestId("tooltip-content")).toBeVisible();
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
    });
  });
});

test.describe("Click handler", () => {
  test.beforeEach(async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
  });

  for (const trigger of ["click", "Enter", "Space"] as const) {
    test(`fires on trigger ${trigger}`, async ({ page }) => {
      const target = page.getByTestId("primary-trigger");
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

test.describe("Edge cases", () => {
  test("an already-open dialog ignores a second open trigger", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await page.getByTestId("primary-trigger").click();
    await expect(page.getByTestId("primary-content")).toBeVisible();
    await page.getByTestId("autofocus-trigger").evaluate((el) => {
      if (el instanceof HTMLElement) el.click();
    });
    await expect(page.getByTestId("primary-content")).toBeVisible();
    const autofocusOpen = await page.evaluate(() => {
      const el = document.querySelector("[data-testid='autofocus-target']")?.closest("dialog");
      return el instanceof HTMLDialogElement ? el.open : false;
    });
    expect(autofocusOpen).toBe(false);
  });

  test("a non-dialog `aria-controls` target is ignored", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await page.getByTestId("bare-trigger").evaluate((el) => {
      const div = document.createElement("div");
      div.id = "not-a-dialog";
      document.body.append(div);
      el.setAttribute("aria-controls", "not-a-dialog");
    });
    await page.getByTestId("bare-trigger").click();
    await expect(page.getByTestId("bare-content")).not.toBeVisible();
  });

  test("Close is ignored when no dialog is open", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await page.getByTestId("primary-close").evaluate((el) => {
      if (el instanceof HTMLElement) el.click();
    });
    await expect(page.getByTestId("primary-content")).not.toBeVisible();
    await expect(page.getByTestId("primary-trigger")).not.toBeFocused();
  });

  test("Escape is ignored when no dialog is open", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await page.getByTestId("focus-before").focus();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("focus-before")).toBeFocused();
    await expect(page.getByTestId("primary-content")).not.toBeVisible();
  });
});

test.describe("Native close", () => {
  test.beforeEach(async ({ page, renderer }) => {
    test.skip(renderer !== "html", "Core-only path; fixture is plain HTML");
    await page.goto("/html/dialog/form");
  });

  test('reopens after a `form method="dialog"` submit closes it natively', async ({ page }) => {
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("content")).toBeVisible();
    await page.getByTestId("submit").click();
    await expect(page.getByTestId("content")).not.toBeVisible();
    await page.getByTestId("trigger").click();
    await expect(page.getByTestId("content")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("content")).not.toBeVisible();
  });

  test("Escape after a native form close does not steal focus", async ({ page }) => {
    await page.getByTestId("trigger").click();
    await page.getByTestId("submit").click();
    await expect(page.getByTestId("content")).not.toBeVisible();
    await page.evaluate(() => {
      const before = document.createElement("button");
      before.dataset.testid = "after-native";
      before.textContent = "After";
      document.body.prepend(before);
      before.focus();
    });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("content")).not.toBeVisible();
    await expect(page.getByTestId("after-native")).toBeFocused();
  });
});
