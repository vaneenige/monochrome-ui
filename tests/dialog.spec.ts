import { expect, test } from "./fixtures";

test.describe("Dialog", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/dialog/basic`);
	});

	test.describe("ARIA Attributes", () => {
		test("should have `aria-haspopup='dialog'` on trigger", async ({
			page,
		}) => {
			await expect(page.getByTestId("primary-trigger")).toHaveAttribute(
				"aria-haspopup",
				"dialog",
			);
		});

		test("should have `aria-controls` on trigger matching content id", async ({
			page,
		}) => {
			const controls = await page
				.getByTestId("primary-trigger")
				.getAttribute("aria-controls");
			const contentId = await page
				.getByTestId("primary-content")
				.getAttribute("id");
			expect(controls).toBe(contentId);
		});

		test("should have `type='button'` on trigger", async ({ page }) => {
			await expect(page.getByTestId("primary-trigger")).toHaveAttribute(
				"type",
				"button",
			);
		});

		test("should not have `aria-expanded` on trigger", async ({ page }) => {
			await expect(page.getByTestId("primary-trigger")).not.toHaveAttribute(
				"aria-expanded",
				/.*/,
			);
		});

		test("content is a native `<dialog>` element", async ({ page }) => {
			const tagName = await page
				.getByTestId("primary-content")
				.evaluate((el) => el.tagName);
			expect(tagName).toBe("DIALOG");
		});

		test("content does not declare `aria-modal` (native dialog implies it)", async ({
			page,
		}) => {
			await expect(page.getByTestId("primary-content")).not.toHaveAttribute(
				"aria-modal",
				/.*/,
			);
		});

		test("content does not declare `popover` (uses showModal, not popover API)", async ({
			page,
		}) => {
			await expect(page.getByTestId("primary-content")).not.toHaveAttribute(
				"popover",
				/.*/,
			);
		});

		test("aria-labelledby on content matches Title id", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			const labelledby = await page
				.getByTestId("primary-content")
				.getAttribute("aria-labelledby");
			const titleId = await page
				.getByTestId("primary-title")
				.getAttribute("id");
			expect(labelledby).toBe(titleId);
		});

		test("aria-describedby on content matches Description id", async ({
			page,
		}) => {
			await page.getByTestId("primary-trigger").click();
			const describedby = await page
				.getByTestId("primary-content")
				.getAttribute("aria-describedby");
			const descId = await page.getByTestId("primary-desc").getAttribute("id");
			expect(describedby).toBe(descId);
		});

		test("aria-label on Content is preserved and no aria-labelledby is added", async ({
			page,
		}) => {
			const content = page.getByTestId("bare-content");
			await expect(content).toHaveAttribute("aria-label", "Quick choice");
			await expect(content).not.toHaveAttribute("aria-labelledby", /.*/);
		});

		test("should pass through `role='alertdialog'` on content", async ({
			page,
		}) => {
			await expect(page.getByTestId("alert-content")).toHaveAttribute(
				"role",
				"alertdialog",
			);
		});
	});

	test.describe("Default State", () => {
		test("should be closed by default", async ({ page }) => {
			await expect(page.getByTestId("primary-content")).not.toBeVisible();
		});

		test("dialog.open is false by default", async ({ page }) => {
			const open = await page
				.getByTestId("primary-content")
				.evaluate((el) => (el as HTMLDialogElement).open);
			expect(open).toBe(false);
		});
	});

	test.describe("Opening", () => {
		test("should open when trigger is clicked", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("primary-content")).toBeVisible();
		});

		test("dialog.open is true when opened", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			const open = await page
				.getByTestId("primary-content")
				.evaluate((el) => (el as HTMLDialogElement).open);
			expect(open).toBe(true);
		});

		test("should open when `Enter` is pressed on trigger", async ({ page }) => {
			await page.getByTestId("primary-trigger").focus();
			await page.keyboard.press("Enter");
			await expect(page.getByTestId("primary-content")).toBeVisible();
		});

		test("should open when `Space` is pressed on trigger", async ({ page }) => {
			await page.getByTestId("primary-trigger").focus();
			await page.keyboard.press("Space");
			await expect(page.getByTestId("primary-content")).toBeVisible();
		});

		test("should not open when trigger is aria-disabled", async ({ page }) => {
			await page.getByTestId("disabled-trigger").click({ force: true });
			await expect(page.getByTestId("disabled-content")).not.toBeVisible();
		});
	});

	test.describe("Modality", () => {
		test("background interactive content is inert when open", async ({
			page,
		}) => {
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("focus-before")).not.toBeFocused();
			// `inert` blocks tab navigation entirely; clicks on inert
			// elements also don't dispatch listeners. Verify by attempting
			// to click and observing focus stays in dialog.
			await page
				.getByTestId("focus-before")
				.click({ force: true, timeout: 100 })
				.catch(() => {});
			const stillFocused = await page
				.getByTestId("primary-content")
				.evaluate((el) => el.contains(document.activeElement));
			expect(stillFocused).toBe(true);
		});

		test("backdrop click does NOT close (true modal)", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("primary-content")).toBeVisible();
			// Click far outside the dialog body. With showModal() the
			// backdrop click lands on the dialog itself and is ignored.
			await page.mouse.click(5, 5);
			await expect(page.getByTestId("primary-content")).toBeVisible();
		});

		test("scroll does not dismiss", async ({ page }) => {
			await page.setViewportSize({ width: 800, height: 300 });
			await page.evaluate(() => {
				const div = document.createElement("div");
				div.style.height = "2000px";
				document.body.appendChild(div);
			});
			await page.getByTestId("primary-trigger").click();
			await page.evaluate(() => window.scrollTo(0, 200));
			await expect(page.getByTestId("primary-content")).toBeVisible();
		});

		test("clicking inside content does not close", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await page.getByTestId("primary-title").click();
			await expect(page.getByTestId("primary-content")).toBeVisible();
		});
	});

	test.describe("Closing", () => {
		test("should close when Close button is clicked", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await page.getByTestId("primary-close").click();
			await expect(page.getByTestId("primary-content")).not.toBeVisible();
		});

		test("should close when Close button is activated via keyboard", async ({
			page,
		}) => {
			await page.getByTestId("primary-trigger").click();
			await page.getByTestId("primary-close").focus();
			await page.keyboard.press("Enter");
			await expect(page.getByTestId("primary-content")).not.toBeVisible();
		});

		test("should close on Escape", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("primary-content")).not.toBeVisible();
		});

		test("dialog.open is false after close", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await page.keyboard.press("Escape");
			const open = await page
				.getByTestId("primary-content")
				.evaluate((el) => (el as HTMLDialogElement).open);
			expect(open).toBe(false);
		});
	});

	test.describe("Focus Management", () => {
		// The core does NOT trap focus. The user agent's "dialog
		// focusing steps" handle initial focus (autofocus, then first
		// focusable, then the dialog itself); `inert` on the rest of
		// the page keeps Tab navigation out of background content. We
		// only verify the spec-defined behaviours we depend on.

		test("should focus first focusable element on open (when no autofocus)", async ({
			page,
		}) => {
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("primary-close")).toBeFocused();
		});

		test("should honor autofocus attribute", async ({ page }) => {
			await page.getByTestId("autofocus-trigger").click();
			await expect(page.getByTestId("autofocus-target")).toBeFocused();
		});

		test("focus lands inside the dialog on open even when there is nothing to focus but Close", async ({
			page,
		}) => {
			await page.getByTestId("bare-trigger").click();
			const inside = await page
				.getByTestId("bare-content")
				.evaluate((el) => el.contains(document.activeElement));
			expect(inside).toBe(true);
		});

		test("background content is unreachable from inside the dialog (inert)", async ({
			page,
		}) => {
			await page.getByTestId("primary-trigger").click();
			await page.getByTestId("primary-action").focus();
			await page.keyboard.press("Tab");
			// `focus-after` lives outside the dialog and must be inert
			// while a modal dialog is open.
			await expect(page.getByTestId("focus-after")).not.toBeFocused();
		});

		test("should return focus to trigger on close", async ({ page }) => {
			await page.getByTestId("primary-trigger").click();
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("primary-trigger")).toBeFocused();
		});
	});

	test.describe("Tabs inside Dialog", () => {
		test("initial tab order reflects selected tab", async ({ page }) => {
			await page.getByTestId("tabs-dialog-trigger").click();
			await expect(page.getByTestId("tabs-dialog-close")).toBeFocused();
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("t1-trigger")).toBeFocused();
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("t1-input")).toBeFocused();
		});

		test("content in inactive tab panel is excluded from tab order", async ({
			page,
		}) => {
			await page.getByTestId("tabs-dialog-trigger").click();
			await page.getByTestId("t2-trigger").click();
			await page.getByTestId("tabs-dialog-close").focus();
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("t2-trigger")).toBeFocused();
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("t2-link")).toBeFocused();
			await expect(page.getByTestId("t1-input")).not.toBeFocused();
		});
	});

	test.describe("Overlay Stacking", () => {
		test("should close open popover when opening dialog", async ({ page }) => {
			await page.getByTestId("popover-trigger").click();
			await expect(page.getByTestId("popover-content")).toBeVisible();
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("popover-content")).not.toBeVisible();
		});

		test("should close open menu when opening dialog", async ({ page }) => {
			await page.getByTestId("menu-trigger").click();
			await expect(page.getByTestId("menu-list")).toBeVisible();
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("menu-list")).not.toBeVisible();
		});

		test("should hide tooltip when opening dialog", async ({ page }) => {
			await page.getByTestId("tooltip-trigger").focus();
			await expect(page.getByTestId("tooltip-content")).toBeVisible();
			await page.getByTestId("primary-trigger").click();
			await expect(page.getByTestId("tooltip-content")).not.toBeVisible();
		});
	});
});
