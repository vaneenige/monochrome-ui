import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Axe WCAG 2.x A/AA pass over one representative fixture per
// component, closed and (where one interaction suffices) open.
// Scoped to the WCAG tags: the fixtures are bare test scaffolding,
// so best-practice rules about landmarks and headings do not apply.
const scan = (page: Page) =>
	new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

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

	test("open menu has no WCAG A/AA violations", async ({ page }) => {
		await page.goto("/html/menu/basic");
		await page.getByTestId("root-trigger").click();
		await expect(page.getByTestId("root-list")).toBeVisible();
		const results = await scan(page);
		expect(results.violations).toEqual([]);
	});

	test("open dialog has no WCAG A/AA violations", async ({ page }) => {
		await page.goto("/html/dialog/basic");
		await page.getByTestId("primary-trigger").click();
		await expect(page.getByTestId("primary-content")).toBeVisible();
		const results = await scan(page);
		expect(results.violations).toEqual([]);
	});
});
