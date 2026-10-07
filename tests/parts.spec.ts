import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const clearOutput = (page: Page) =>
  page.getByTestId("output").evaluate((el) => {
    el.textContent = "";
  });

test.describe("Parts", () => {
  test.beforeEach(async ({ page, renderer }) => {
    test.skip(renderer === "html", "Click handlers are part props");
    await page.goto(`/${renderer}/parts/disabled`);
  });

  test("a disabled menu item never runs its click handler", async ({ page }) => {
    await page.getByTestId("menu-trigger").click();
    await expect(page.getByTestId("menu-list")).toBeVisible();
    await expect(page.getByTestId("output")).toHaveText("menu-trigger;");
    await clearOutput(page);

    for (const id of [
      "menu-item",
      "menu-link",
      "menu-checkbox",
      "menu-radio",
      "menu-sub-trigger",
    ]) {
      await page.getByTestId(id).click({ force: true });
      await expect(page.getByTestId("menu-list")).toBeVisible();
    }
    await expect(page.getByTestId("menu-link")).not.toHaveAttribute("href");
    await expect(page.getByTestId("output")).toHaveText("");

    await page.getByTestId("menu-enabled").click();
    await expect(page.getByTestId("output")).toHaveText("menu-enabled;");
  });

  for (const activation of ["click", "Enter", "Space"] as const) {
    test(`a disabled trigger or tab never runs its click handler on ${activation}`, async ({
      page,
    }) => {
      for (const id of [
        "menu-trigger-off",
        "menubar-item",
        "menubar-trigger",
        "accordion-trigger",
        "collapsible-trigger",
        "dialog-trigger",
        "popover-trigger",
        "tab",
      ]) {
        const part = page.getByTestId(id);
        await expect(part).toHaveAttribute("aria-disabled", "true");
        if (activation === "click") {
          await part.click({ force: true });
        } else {
          await part.focus();
          await page.keyboard.press(activation);
        }
      }
      await expect(page.getByTestId("output")).toHaveText("");

      for (const id of ["accordion-enabled", "tab-enabled"]) {
        const part = page.getByTestId(id);
        if (activation === "click") {
          await part.click();
        } else {
          await part.focus();
          await page.keyboard.press(activation);
        }
      }
      await expect(page.getByTestId("output")).toHaveText("accordion-enabled;tab-enabled;");
    });
  }
});
