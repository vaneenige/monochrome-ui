import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Axe WCAG 2.x A/AA pass over one representative fixture per
// component, closed and (where one interaction suffices) open.
// Scoped to the WCAG tags: the fixtures are bare test scaffolding,
// so best-practice rules about landmarks and headings do not apply.
const scan = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

test.describe("Accessibility (axe)", () => {
  test.beforeEach(({ renderer }) => {
    test.skip(renderer !== "html", "Markup parity is covered by other suites");
  });

  const fixtures = [
    "accordion/single",
    "collapsible/basic",
    "dialog/basic",
    "menu/basic",
    "menu/menubar",
    "menu/checkbox-radio",
    "popover/basic",
    "tabs/horizontal",
    "tooltip/basic",
  ];

  for (const name of fixtures) {
    test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(`/html/${name}`);
      const results = await scan(page);
      expect(results.violations).toEqual([]);
    });
  }

  const openMenus = [
    {
      name: "menu/basic",
      trigger: "root-trigger",
      list: "root-list",
      subTrigger: "root-submenu-trigger",
      subList: "root-submenu-list",
    },
    {
      name: "menu/menubar",
      trigger: "menubar-trigger-1",
      list: "menubar-list-1",
      subTrigger: "menubar-submenu-trigger-1",
      subList: "menubar-submenu-list-1",
    },
    {
      name: "menu/checkbox-radio",
      trigger: "trigger",
      list: "list",
    },
    {
      name: "menu/siblings",
      trigger: "trigger",
      list: "list",
      subTrigger: "share-trigger",
      subList: "share-list",
    },
    {
      name: "menu/nested-content",
      trigger: "nested-menu-trigger",
      list: "nested-menu-list",
    },
    {
      name: "menu/structure-independence",
      trigger: "c-trigger",
      list: "c-list",
      subTrigger: "c-submenu-trigger",
      subList: "c-submenu-list",
    },
  ] as const;

  for (const fixture of openMenus) {
    test(`open ${fixture.name} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(`/html/${fixture.name}`);
      await page.getByTestId(fixture.trigger).click();
      await expect(page.getByTestId(fixture.list)).toBeVisible();
      const opened = await scan(page);
      expect(opened.violations).toEqual([]);
      if ("subTrigger" in fixture) {
        await page.getByTestId(fixture.subTrigger).hover();
        await expect(page.getByTestId(fixture.subList)).toBeVisible();
        const nested = await scan(page);
        expect(nested.violations).toEqual([]);
      }
    });
  }

  test("open dialog has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/html/dialog/basic");
    await page.getByTestId("primary-trigger").click();
    await expect(page.getByTestId("primary-content")).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("open accordion has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/html/accordion/single");
    await page.getByTestId("single-trigger-1").click();
    await expect(page.getByTestId("single-content-1")).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test("selected tab has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/html/tabs/horizontal");
    await page.getByTestId("tab-2").click();
    await expect(page.getByTestId("panel-2")).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test("open popover has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/html/popover/basic");
    await page.getByTestId("click-trigger").click();
    await expect(page.getByTestId("click-content")).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByTestId("dialog-popover-trigger").click();
    await expect(page.getByTestId("dialog-popover-content")).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test("shown tooltip has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/html/tooltip/basic");
    await page.getByTestId("tooltip-trigger").focus();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });
});
