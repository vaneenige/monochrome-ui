import { expect, test } from "./fixtures";

test.describe("Popover", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/popover/basic`);
	});

	test.describe("ARIA Attributes", () => {
		test("should have `aria-expanded='false'` on trigger when closed", async ({
			page,
		}) => {
			await expect(page.getByTestId("click-trigger")).toHaveAttribute(
				"aria-expanded",
				"false",
			);
		});

		test("should have `aria-expanded='true'` on trigger when open", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-trigger")).toHaveAttribute(
				"aria-expanded",
				"true",
			);
		});

		test("should have `aria-controls` on trigger matching content id", async ({
			page,
		}) => {
			const ariaControls = await page
				.getByTestId("click-trigger")
				.getAttribute("aria-controls");
			const contentId = await page
				.getByTestId("click-content")
				.getAttribute("id");
			expect(ariaControls).toBe(contentId);
		});

		test("should have `aria-labelledby` on content matching trigger id", async ({
			page,
		}) => {
			const triggerId = await page
				.getByTestId("click-trigger")
				.getAttribute("id");
			await expect(page.getByTestId("click-content")).toHaveAttribute(
				"aria-labelledby",
				triggerId as string,
			);
		});

		test("should have `aria-hidden='true'` on content when closed", async ({
			page,
		}) => {
			await expect(page.getByTestId("click-content")).toHaveAttribute(
				"aria-hidden",
				"true",
			);
		});

		test("should have `aria-hidden='false'` on content when open", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toHaveAttribute(
				"aria-hidden",
				"false",
			);
		});

		test("should have `popover='manual'` on content", async ({ page }) => {
			await expect(page.getByTestId("click-content")).toHaveAttribute(
				"popover",
				"manual",
			);
		});

		test("should have `type='button'` on trigger", async ({ page }) => {
			await expect(page.getByTestId("click-trigger")).toHaveAttribute(
				"type",
				"button",
			);
		});
	});

	test.describe("Click Behavior", () => {
		test("should open on click", async ({ page }) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toBeVisible();
		});

		test("should close on second click of trigger", async ({ page }) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).not.toBeVisible();
		});

		test("should stay open when clicking inside content", async ({ page }) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("click-text").click();
			await expect(page.getByTestId("click-content")).toBeVisible();
		});

		test("should allow interactive children to fire their own handlers", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("copy-button").click();
			await expect(page.getByTestId("output")).toHaveText("copy-clicked");
			await expect(page.getByTestId("click-content")).toBeVisible();
		});

		test("should close on click outside", async ({ page }) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("focus-before").click();
			await expect(page.getByTestId("click-content")).not.toBeVisible();
		});

		test("should close other popover when opening a new one", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("second-trigger").click();
			await expect(page.getByTestId("click-content")).not.toBeVisible();
			await expect(page.getByTestId("second-content")).toBeVisible();
		});
	});

	test.describe("Keyboard", () => {
		test("should open on Enter", async ({ page }) => {
			await page.getByTestId("click-trigger").focus();
			await page.keyboard.press("Enter");
			await expect(page.getByTestId("click-content")).toBeVisible();
		});

		test("should open on Space", async ({ page }) => {
			await page.getByTestId("click-trigger").focus();
			await page.keyboard.press("Space");
			await expect(page.getByTestId("click-content")).toBeVisible();
		});

		test("should close on Escape and return focus to trigger", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toBeVisible();
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("click-content")).not.toBeVisible();
			await expect(page.getByTestId("click-trigger")).toBeFocused();
		});
	});

	test.describe("Focus Management", () => {
		test("should move focus to content on click-open", async ({ page }) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toBeFocused();
		});

		test("should return focus to trigger when closed by trigger click", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-trigger")).toBeFocused();
		});

		test("should tab from content into focusable children", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("copy-button")).toBeFocused();
		});

		test("should return focus to trigger via Escape from a focused child", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("copy-button").focus();
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("click-content")).not.toBeVisible();
			await expect(page.getByTestId("click-trigger")).toBeFocused();
		});

		test("should close when focus leaves the popover via Tab past last focusable", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await page.getByTestId("copy-button").focus();
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("click-content")).not.toBeVisible();
		});

		test("should close when focus leaves the popover via Shift+Tab back to the trigger's previous sibling", async ({
			page,
		}) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toBeVisible();
			await page.getByTestId("click-trigger").focus();
			await page.keyboard.press("Shift+Tab");
			await expect(page.getByTestId("click-content")).not.toBeVisible();
		});
	});

	test.describe("Disabled", () => {
		test("should not open when trigger has `aria-disabled='true'`", async ({
			page,
		}) => {
			await page.getByTestId("disabled-trigger").click({ force: true });
			await expect(page.getByTestId("disabled-content")).not.toBeVisible();
		});

		test("should not open when disabled trigger is activated via keyboard", async ({
			page,
		}) => {
			await page.getByTestId("disabled-trigger").focus();
			await page.keyboard.press("Enter");
			await expect(page.getByTestId("disabled-content")).not.toBeVisible();
		});
	});

	test.describe("Mutual Exclusion", () => {
		test("should close when page is scrolled outside popover", async ({
			page,
		}) => {
			await page.setViewportSize({ width: 800, height: 300 });
			await page.evaluate(() => {
				const div = document.createElement("div");
				div.style.height = "2000px";
				document.body.appendChild(div);
			});
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toBeVisible();
			await page.evaluate(() => window.scrollTo(0, 200));
			await expect(page.getByTestId("click-content")).not.toBeVisible();
		});

		test("should stay open when scrolling a scrollable child inside content", async ({
			page,
		}) => {
			await page.getByTestId("scroll-trigger").click();
			await expect(page.getByTestId("scroll-content")).toBeVisible();
			await page.getByTestId("scroll-inner").evaluate((el) => {
				el.scrollTop = 50;
			});
			await expect(page.getByTestId("scroll-content")).toBeVisible();
		});

		test("should close popover when opening a menu", async ({ page }) => {
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("click-content")).toBeVisible();
			await page.getByTestId("menu-trigger").click();
			await expect(page.getByTestId("click-content")).not.toBeVisible();
			await expect(page.getByTestId("menu-list")).toBeVisible();
		});

		test("should close menu when opening a popover", async ({ page }) => {
			await page.getByTestId("menu-trigger").click();
			await expect(page.getByTestId("menu-list")).toBeVisible();
			await page.getByTestId("click-trigger").click();
			await expect(page.getByTestId("menu-list")).not.toBeVisible();
			await expect(page.getByTestId("click-content")).toBeVisible();
		});
	});
});
