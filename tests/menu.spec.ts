import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { scrollAndSettle } from "./helpers";

const openRoot = async (page: Page) => {
	await page.getByTestId("root-trigger").click();
	await expect(page.getByTestId("root-list")).toBeVisible();
};

const openRootViaKeyboard = async (page: Page) => {
	await page.getByTestId("root-trigger").focus();
	await page.getByTestId("root-trigger").press("Enter");
	await expect(page.getByTestId("root-list")).toBeVisible();
};

const openSubmenuViaHover = async (page: Page) => {
	await page.getByTestId("root-submenu-trigger").hover();
	await expect(page.getByTestId("root-submenu-list")).toBeVisible();
};

const openSubmenuViaKeyboard = async (page: Page) => {
	await page.getByTestId("root-submenu-trigger").focus();
	await page.getByTestId("root-submenu-trigger").press("Enter");
	await expect(page.getByTestId("root-submenu-list")).toBeVisible();
};

test.describe("Menu", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/basic`);
	});

	test.describe("ARIA", () => {
		test("declares the menu button contract on the trigger", async ({
			page,
		}) => {
			const trigger = page.getByTestId("root-trigger");
			const list = page.getByTestId("root-list");
			const listId = await list.getAttribute("id");
			const triggerId = await trigger.getAttribute("id");

			await expect(trigger).toHaveAttribute("role", "button");
			await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
			await expect(trigger).toHaveAttribute("tabindex", "0");
			await expect(trigger).toHaveAttribute("aria-controls", listId as string);
			await expect(list).toHaveAttribute("role", "menu");
			await expect(list).toHaveAttribute("popover", "manual");
			await expect(list).toHaveAttribute(
				"aria-labelledby",
				triggerId as string,
			);
		});

		test("toggles `aria-expanded` / `aria-hidden` across the open and close cycle", async ({
			page,
		}) => {
			const trigger = page.getByTestId("root-trigger");
			const list = page.getByTestId("root-list");

			await expect(trigger).toHaveAttribute("aria-expanded", "false");
			await expect(list).toHaveAttribute("aria-hidden", "true");

			await trigger.click();
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
			await expect(list).toHaveAttribute("aria-hidden", "false");

			await trigger.click();
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
			await expect(list).toHaveAttribute("aria-hidden", "true");
		});

		test("declares menuitem role and roving tabindex on every item", async ({
			page,
		}) => {
			await openRoot(page);
			for (const id of ["root-item-1", "root-item-2", "root-item-3"]) {
				await expect(page.getByTestId(id)).toHaveAttribute("role", "menuitem");
				await expect(page.getByTestId(id)).toHaveAttribute("tabindex", "-1");
			}
			await expect(
				page.getByTestId("root-item-1").locator(".."),
			).toHaveAttribute("role", "none");
		});

		test("declares menuitem + `aria-haspopup` on the submenu trigger and links its submenu", async ({
			page,
		}) => {
			await openRoot(page);
			const subTrigger = page.getByTestId("root-submenu-trigger");
			const subList = page.getByTestId("root-submenu-list");
			const subTriggerId = await subTrigger.getAttribute("id");

			await expect(subTrigger).toHaveAttribute("role", "menuitem");
			await expect(subTrigger).toHaveAttribute("aria-haspopup", "menu");
			await expect(subTrigger).toHaveAttribute("tabindex", "-1");
			await expect(subTrigger).toHaveAttribute("aria-expanded", "false");
			await expect(subList).toHaveAttribute("aria-hidden", "true");
			await expect(subList).toHaveAttribute("role", "menu");
			await expect(subList).toHaveAttribute(
				"aria-labelledby",
				subTriggerId as string,
			);

			await openSubmenuViaHover(page);
			await expect(subTrigger).toHaveAttribute("aria-expanded", "true");
			await expect(subList).toHaveAttribute("aria-hidden", "false");
		});

		test("declares `aria-disabled` and skips disabled items in focus", async ({
			page,
			renderer,
		}) => {
			await page.goto(`/${renderer}/menu/edge-cases`);
			await page.getByTestId("disabled-first-trigger").click();
			for (const id of ["disabled-first-item-1", "disabled-first-item-4"]) {
				await expect(page.getByTestId(id)).toHaveAttribute(
					"aria-disabled",
					"true",
				);
				await expect(page.getByTestId(id)).toHaveAttribute("tabindex", "-1");
			}
		});
	});

	test.describe("Trigger keyboard", () => {
		for (const key of ["Enter", "Space", "ArrowDown"] as const) {
			test(`${key} opens the menu and focuses the first item`, async ({
				page,
			}) => {
				await page.getByTestId("root-trigger").focus();
				await page.getByTestId("root-trigger").press(key);
				await expect(page.getByTestId("root-list")).toBeVisible();
				await expect(page.getByTestId("root-item-1")).toBeFocused();
			});
		}

		test("ArrowUp opens the menu and focuses the last item", async ({
			page,
		}) => {
			await page.getByTestId("root-trigger").focus();
			await page.getByTestId("root-trigger").press("ArrowUp");
			await expect(page.getByTestId("root-list")).toBeVisible();
			await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
		});

		test("Escape from the trigger after open returns focus to the trigger and closes", async ({
			page,
		}) => {
			await openRootViaKeyboard(page);
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("root-trigger")).toBeFocused();
		});

		test("Tab closes the menu and moves focus forward; Shift+Tab moves it backward", async ({
			page,
		}) => {
			await openRootViaKeyboard(page);
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("focus-after")).toBeFocused();

			await openRootViaKeyboard(page);
			await page.keyboard.press("Shift+Tab");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("focus-before")).toBeFocused();
		});

		test("ArrowDown on an already-open trigger focuses the first item", async ({
			page,
		}) => {
			await openRoot(page);
			await page.getByTestId("root-trigger").press("ArrowDown");
			await expect(page.getByTestId("root-item-1")).toBeFocused();
		});

		test("ArrowUp on an already-open trigger focuses the last item", async ({
			page,
		}) => {
			await openRoot(page);
			await page.getByTestId("root-trigger").press("ArrowUp");
			await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
		});
	});

	test.describe("Item keyboard", () => {
		test.beforeEach(async ({ page }) => {
			await openRootViaKeyboard(page);
		});

		test("ArrowDown / ArrowUp wrap around the item list", async ({ page }) => {
			await expect(page.getByTestId("root-item-1")).toBeFocused();
			await page.keyboard.press("ArrowDown");
			await expect(page.getByTestId("root-item-2")).toBeFocused();
			await page.keyboard.press("ArrowUp");
			await expect(page.getByTestId("root-item-1")).toBeFocused();
			await page.keyboard.press("ArrowUp");
			await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
			await page.keyboard.press("ArrowDown");
			await expect(page.getByTestId("root-item-1")).toBeFocused();
		});

		test("Home / End jump to first / last item", async ({ page }) => {
			await page.getByTestId("root-item-2").press("End");
			await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
			await page.keyboard.press("Home");
			await expect(page.getByTestId("root-item-1")).toBeFocused();
		});

		test("ArrowLeft / ArrowRight on a regular item are inert (no submenu)", async ({
			page,
		}) => {
			await page.getByTestId("root-item-1").press("ArrowLeft");
			await expect(page.getByTestId("root-item-1")).toBeFocused();
			await page.getByTestId("root-item-1").press("ArrowRight");
			await expect(page.getByTestId("root-item-1")).toBeFocused();
		});

		test("Escape from an item closes the menu and returns focus to the trigger", async ({
			page,
		}) => {
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("root-trigger")).toBeFocused();
		});
	});

	test.describe("Submenu keyboard", () => {
		test.beforeEach(async ({ page }) => {
			await openRootViaKeyboard(page);
		});

		for (const key of ["Enter", "Space", "ArrowRight"] as const) {
			test(`${key} on the submenu trigger opens it and focuses the first item`, async ({
				page,
			}) => {
				await page.getByTestId("root-submenu-trigger").focus();
				await page.getByTestId("root-submenu-trigger").press(key);
				await expect(page.getByTestId("root-submenu-list")).toBeVisible();
				await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
			});
		}

		for (const key of ["ArrowLeft", "Escape"] as const) {
			test(`${key} inside the submenu closes it and focuses the submenu trigger`, async ({
				page,
			}) => {
				await openSubmenuViaKeyboard(page);
				await page.getByTestId("root-submenu-item-1").press(key);
				await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
				await expect(page.getByTestId("root-submenu-trigger")).toBeFocused();
			});
		}

		test("ArrowDown / ArrowUp wrap around the submenu items", async ({
			page,
		}) => {
			await openSubmenuViaKeyboard(page);
			await page.keyboard.press("ArrowDown");
			await expect(page.getByTestId("root-submenu-item-2")).toBeFocused();
			await page.keyboard.press("ArrowUp");
			await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
			await page.keyboard.press("ArrowUp");
			await expect(page.getByTestId("root-submenu-item-3")).toBeFocused();
			await page.keyboard.press("ArrowDown");
			await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
		});

		test("Home / End jump within the submenu", async ({ page }) => {
			await openSubmenuViaKeyboard(page);
			await page.keyboard.press("End");
			await expect(page.getByTestId("root-submenu-item-3")).toBeFocused();
			await page.keyboard.press("Home");
			await expect(page.getByTestId("root-submenu-item-1")).toBeFocused();
		});

		test("Tab inside the submenu closes all menus and continues outside", async ({
			page,
		}) => {
			await openSubmenuViaKeyboard(page);
			await page.keyboard.press("Tab");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
			await expect(page.getByTestId("focus-after")).toBeFocused();
		});

		test("Shift+Tab inside the submenu closes all menus and continues backward", async ({
			page,
		}) => {
			await openSubmenuViaKeyboard(page);
			await page.keyboard.press("Shift+Tab");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
			await expect(page.getByTestId("focus-before")).toBeFocused();
		});
	});

	test.describe("Mouse", () => {
		test("trigger click opens the menu without moving focus to the first item", async ({
			page,
		}) => {
			await openRoot(page);
			await expect(page.getByTestId("root-item-1")).not.toBeFocused();
		});

		test("trigger hover does not open the menu", async ({ page }) => {
			await page.getByTestId("root-trigger").hover();
			await expect(page.getByTestId("root-list")).not.toBeVisible();
		});

		test("outside click closes the menu, including any open submenu", async ({
			page,
		}) => {
			await openRoot(page);
			await openSubmenuViaHover(page);
			await page.getByTestId("scroll-container").click();
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
		});

		test("clicking a different root trigger closes the first menu and opens the second", async ({
			page,
		}) => {
			await openRoot(page);
			await page.getByTestId("second-trigger").dispatchEvent("click");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
			await expect(page.getByTestId("second-list")).toBeVisible();
		});

		test("hovering an item does not move focus to it", async ({ page }) => {
			await openRoot(page);
			await page.getByTestId("root-item-2").hover();
			await expect(page.getByTestId("root-item-2")).not.toBeFocused();
		});

		test("hovering a submenu trigger opens its submenu; leaving to another item closes it", async ({
			page,
		}) => {
			await openRoot(page);
			await openSubmenuViaHover(page);
			await page.getByTestId("root-submenu-item-2").hover();
			await expect(page.getByTestId("root-submenu-list")).toBeVisible();
			await expect(page.getByTestId("root-list")).toBeVisible();

			await page.getByTestId("root-item-1").hover();
			await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
		});

		test("clicking the submenu trigger opens the submenu", async ({ page }) => {
			await openRoot(page);
			await page.getByTestId("root-submenu-trigger").click();
			await expect(page.getByTestId("root-submenu-list")).toBeVisible();
		});

		test("pointermove on the menu list container does not close an open submenu", async ({
			page,
		}) => {
			await openRoot(page);
			await openSubmenuViaHover(page);
			await page.getByTestId("root-list").dispatchEvent("pointermove");
			await expect(page.getByTestId("root-submenu-list")).toBeVisible();
		});

		for (const activation of ["click", "Enter", "Space"] as const) {
			test(`activating a regular menuitem via ${activation} closes all menus`, async ({
				page,
			}) => {
				await openRoot(page);
				if (activation === "click") {
					await page.getByTestId("root-item-1").click();
				} else {
					await page.getByTestId("root-item-1").focus();
					await page.keyboard.press(activation);
				}
				await expect(page.getByTestId("root-list")).not.toBeVisible();
			});

			test(`activating a submenu item via ${activation} closes all menus`, async ({
				page,
			}) => {
				await openRoot(page);
				await openSubmenuViaHover(page);
				if (activation === "click") {
					await page.getByTestId("root-submenu-item-1").click();
				} else {
					await page.getByTestId("root-submenu-item-1").focus();
					await page.keyboard.press(activation);
				}
				await expect(page.getByTestId("root-list")).not.toBeVisible();
				await expect(page.getByTestId("root-submenu-list")).not.toBeVisible();
			});
		}

		test("clicking a disabled menuitem keeps the menu open", async ({
			page,
			renderer,
		}) => {
			await page.goto(`/${renderer}/menu/edge-cases`);
			await page.getByTestId("disabled-first-trigger").click();
			await page.getByTestId("disabled-first-item-1").click({ force: true });
			await expect(page.getByTestId("disabled-first-list")).toBeVisible();
		});

		test("a stopPropagation handler on the menuitem prevents the menu from closing", async ({
			page,
		}) => {
			await openRoot(page);
			await page.getByTestId("root-item-1").evaluate((el) => {
				el.addEventListener("click", (e) => e.stopPropagation());
			});
			await page.getByTestId("root-item-1").click();
			await expect(page.getByTestId("root-list")).toBeVisible();
		});
	});

	test.describe("Trigger with nested SVG", () => {
		test("clicking the SVG opens the menu", async ({ page }) => {
			const svg = page.getByTestId("svg-icon");
			const list = page.getByTestId("svg-list");
			await svg.click();
			await expect(list).toBeVisible();
			await page.keyboard.press("Escape");
			await expect(list).not.toBeVisible();
		});
	});

	test.describe("Scroll dismissal", () => {
		test("scroll on a nested element closes the menu", async ({ page }) => {
			await openRoot(page);
			await page.getByTestId("scroll-container").dispatchEvent("scroll");
			await expect(page.getByTestId("root-list")).not.toBeVisible();
		});

		test("scroll inside the menu list itself does not close the menu", async ({
			page,
		}) => {
			await openRoot(page);
			await page.getByTestId("root-list").dispatchEvent("scroll");
			await expect(page.getByTestId("root-list")).toBeVisible();
		});

		test("scroll inside a scrollable region nested in the popover does not close the menu", async ({
			page,
			renderer,
		}) => {
			test.skip(
				renderer !== "html",
				"Core-only dismissal path; fixture is plain HTML",
			);
			await page.goto("/html/menu/scrollable");
			await page.getByTestId("trigger").click();
			await expect(page.getByTestId("list")).toBeVisible();
			await page.getByTestId("scroll-region").evaluate(
				(el) =>
					new Promise<void>((resolve) => {
						el.addEventListener("scroll", () => resolve(), { once: true });
						el.scrollTop = 100;
					}),
			);
			await expect(page.getByTestId("list")).toBeVisible();
		});

		test("document scroll closes the menu", async ({ page }) => {
			await page.evaluate(() => {
				document.body.style.height = "3000px";
			});
			await openRoot(page);
			await page.evaluate(() => window.scrollBy(0, 100));
			await expect(page.getByTestId("root-list")).not.toBeVisible();
		});

		test("keyboard navigation between items does not dismiss the menu", async ({
			page,
		}) => {
			await openRoot(page);
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("ArrowUp");
			await expect(page.getByTestId("root-list")).toBeVisible();
		});

		test("viewport resize closes the menu", async ({ page }) => {
			await openRoot(page);
			await page.setViewportSize({ width: 800, height: 400 });
			await expect(page.getByTestId("root-list")).not.toBeVisible();
		});
	});

	test.describe("Scroll prevention", () => {
		test.beforeEach(async ({ page }) => {
			await page.evaluate(() => {
				document.body.style.height = "3000px";
			});
			await scrollAndSettle(page, 0, 500);
		});

		for (const [key, prep] of [
			["Space", "trigger"],
			["ArrowDown", "trigger"],
			["ArrowDown", "item"],
		] as const) {
			test(`${key} on the ${prep} does not scroll the page`, async ({
				page,
			}) => {
				if (prep === "item") {
					await scrollAndSettle(page, 0, 0);
					await openRootViaKeyboard(page);
				} else {
					await page.getByTestId("root-trigger").focus();
				}
				const before = await page.evaluate(() => window.scrollY);
				await page.keyboard.press(key);
				const after = await page.evaluate(() => window.scrollY);
				expect(after).toBe(before);
			});
		}
	});
});

test.describe("Typeahead", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/typeahead`);
		await page.getByTestId("typeahead-trigger").focus();
		await page.getByTestId("typeahead-trigger").press("Enter");
		await expect(page.getByTestId("typeahead-item-1")).toBeFocused();
	});

	test("a letter focuses the first matching item; repeating it cycles", async ({
		page,
	}) => {
		await page.keyboard.press("b");
		await expect(page.getByTestId("typeahead-item-2")).toBeFocused();
		await page.keyboard.press("a");
		await expect(page.getByTestId("typeahead-item-3")).toBeFocused();
		await page.getByTestId("typeahead-item-5").focus();
		await page.keyboard.press("a");
		await expect(page.getByTestId("typeahead-item-1")).toBeFocused();
	});

	test("skips disabled items", async ({ page }) => {
		await page.getByTestId("typeahead-item-3").focus();
		await page.keyboard.press("a");
		await expect(page.getByTestId("typeahead-item-5")).toBeFocused();
	});

	test("no-op when no items match", async ({ page }) => {
		await page.keyboard.press("z");
		await expect(page.getByTestId("typeahead-item-1")).toBeFocused();
	});

	test("arrow navigation works after typeahead", async ({ page }) => {
		await page.keyboard.press("b");
		await expect(page.getByTestId("typeahead-item-2")).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("typeahead-item-3")).toBeFocused();
	});

	test("matches items whose markup indents the label text", async ({
		page,
		renderer,
	}) => {
		test.skip(
			renderer !== "html",
			"Wrapper output carries no whitespace; hand-written HTML does",
		);
		await page.goto("/html/menu/formatted");
		await page.getByTestId("trigger").focus();
		await page.getByTestId("trigger").press("Enter");
		await expect(page.getByTestId("item-profile")).toBeFocused();
		await page.keyboard.press("s");
		await expect(page.getByTestId("item-settings")).toBeFocused();
	});
});

test.describe("Edge cases", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/edge-cases`);
	});

	test("opening the menu via Enter skips a disabled first item", async ({
		page,
	}) => {
		await page.getByTestId("disabled-first-trigger").focus();
		await page.getByTestId("disabled-first-trigger").press("Enter");
		await expect(page.getByTestId("disabled-first-item-2")).toBeFocused();
	});

	test("arrow / Home / End all skip disabled items", async ({ page }) => {
		await page.getByTestId("disabled-first-trigger").focus();
		await page.getByTestId("disabled-first-trigger").press("Enter");
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("disabled-first-item-3")).toBeFocused();
		await page.keyboard.press("ArrowUp");
		await expect(page.getByTestId("disabled-first-item-2")).toBeFocused();
		await page.keyboard.press("End");
		await expect(page.getByTestId("disabled-first-item-3")).toBeFocused();
		await page.keyboard.press("Home");
		await expect(page.getByTestId("disabled-first-item-2")).toBeFocused();
	});

	test("an all-disabled menu still opens", async ({ page }) => {
		await page.getByTestId("all-disabled-trigger").focus();
		await page.getByTestId("all-disabled-trigger").press("Enter");
		await expect(page.getByTestId("all-disabled-list")).toBeVisible();
	});

	test("an empty menu opens, dismisses on Escape, and survives arrow keys", async ({
		page,
	}) => {
		await page.getByTestId("no-items-trigger").focus();
		await page.getByTestId("no-items-trigger").press("Enter");
		await expect(page.getByTestId("no-items-trigger")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("no-items-trigger")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("no-items-trigger")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	});
});

test.describe("Menubar", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/menubar`);
	});

	test.describe("ARIA", () => {
		test("declares menubar / menuitem roles and roving tabindex", async ({
			page,
		}) => {
			await expect(page.getByTestId("menubar-list")).toHaveAttribute(
				"role",
				"menubar",
			);
			await expect(page.getByTestId("menubar-trigger-1")).toHaveAttribute(
				"tabindex",
				"0",
			);
			for (const id of [
				"menubar-trigger-1",
				"menubar-trigger-2",
				"menubar-trigger-3",
			]) {
				await expect(page.getByTestId(id)).toHaveAttribute("role", "menuitem");
				await expect(page.getByTestId(id)).toHaveAttribute(
					"aria-haspopup",
					"menu",
				);
			}
			for (const id of ["menubar-trigger-2", "menubar-trigger-3"]) {
				await expect(page.getByTestId(id)).toHaveAttribute("tabindex", "-1");
			}
		});

		test("toggles `aria-expanded` across open and close", async ({ page }) => {
			const trigger = page.getByTestId("menubar-trigger-1");
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
			await trigger.click();
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
		});
	});

	test.describe("Keyboard navigation", () => {
		test("ArrowRight / ArrowLeft wrap around menubar items", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.keyboard.press("ArrowRight");
			await expect(page.getByTestId("menubar-item-1")).toBeFocused();
			// Backward navigation from a non-edge position.
			await page.getByTestId("menubar-trigger-2").focus();
			await page.keyboard.press("ArrowLeft");
			await expect(page.getByTestId("menubar-item-1")).toBeFocused();
			await page.getByTestId("menubar-trigger-3").focus();
			await page.keyboard.press("ArrowRight");
			await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
			await page.keyboard.press("ArrowLeft");
			await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
		});

		test("Home / End jump to first / last menubar item", async ({ page }) => {
			await page.getByTestId("menubar-trigger-2").focus();
			await page.keyboard.press("Home");
			await expect(page.getByTestId("menubar-trigger-1")).toBeFocused();
			await page.keyboard.press("End");
			await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
		});

		for (const key of ["Enter", "Space", "ArrowDown"] as const) {
			test(`${key} on a menubar trigger opens its menu and focuses the first item`, async ({
				page,
			}) => {
				await page.getByTestId("menubar-trigger-1").focus();
				await page.getByTestId("menubar-trigger-1").press(key);
				await expect(page.getByTestId("menubar-list-1")).toBeVisible();
				await expect(page.getByTestId("menubar-item-1-1")).toBeFocused();
			});
		}

		test("ArrowUp on a menubar trigger opens its menu and focuses the last item", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.getByTestId("menubar-trigger-1").press("ArrowUp");
			await expect(page.getByTestId("menubar-list-1")).toBeVisible();
			await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
		});

		test("ArrowLeft from inside a menubar menu closes it and moves focus to the previous trigger", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-2").focus();
			await page.getByTestId("menubar-trigger-2").press("Enter");
			await page.getByTestId("menubar-item-2-1").focus();
			await page.getByTestId("menubar-item-2-1").press("ArrowLeft");
			await expect(page.getByTestId("menubar-item-1")).toBeFocused();
			await expect(page.getByTestId("menubar-list-2")).not.toBeVisible();
		});

		test("ArrowLeft from a menubar menu lands on the previous trigger and opens its menu", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.getByTestId("menubar-trigger-1").press("Enter");
			await page.getByTestId("menubar-item-1-1").focus();
			await page.getByTestId("menubar-item-1-1").press("ArrowLeft");
			await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
			await expect(page.getByTestId("menubar-list-3")).toBeVisible();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
		});

		test("ArrowLeft on a menubar trigger with menu open jumps to the previous trigger and opens its menu", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").click();
			await page.getByTestId("menubar-trigger-1").press("ArrowLeft");
			await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
			await expect(page.getByTestId("menubar-list-3")).toBeVisible();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
		});

		test("ArrowRight on a menubar menuitem without submenu closes it and moves to the next trigger", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.getByTestId("menubar-trigger-1").press("Enter");
			await page.getByTestId("menubar-item-1-1").focus();
			await page.getByTestId("menubar-item-1-1").press("ArrowRight");
			await expect(page.getByTestId("menubar-item-1")).toBeFocused();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
		});

		test("ArrowRight on a submenu item closes everything and moves to the next trigger", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.getByTestId("menubar-trigger-1").press("Enter");
			await page.getByTestId("menubar-submenu-trigger-1").focus();
			await page.getByTestId("menubar-submenu-trigger-1").press("Enter");
			await page.getByTestId("menubar-submenu-item-1-1").press("ArrowRight");
			await expect(page.getByTestId("menubar-item-1")).toBeFocused();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
			await expect(
				page.getByTestId("menubar-submenu-list-1"),
			).not.toBeVisible();
		});

		test("ArrowLeft on a submenu trigger with submenu closed moves to the previous menubar trigger", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.getByTestId("menubar-trigger-1").press("Enter");
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("ArrowDown");
			await expect(page.getByTestId("menubar-submenu-trigger-1")).toBeFocused();
			await page.keyboard.press("ArrowLeft");
			await expect(page.getByTestId("menubar-trigger-3")).toBeFocused();
			await expect(page.getByTestId("menubar-list-3")).toBeVisible();
		});

		test("ArrowRight from a non-menu standalone menuitem just navigates the menubar without opening", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").focus();
			await page.getByTestId("menubar-trigger-1").press("Enter");
			await page.getByTestId("menubar-item-1-1").press("ArrowRight");
			await expect(page.getByTestId("menubar-item-1")).toBeFocused();
			await page.getByTestId("menubar-item-1").press("ArrowRight");
			await expect(page.getByTestId("menubar-trigger-2")).toBeFocused();
			await expect(page.getByTestId("menubar-list-2")).not.toBeVisible();
		});
	});

	test.describe("Mouse", () => {
		test("trigger click opens the menu without moving focus", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").hover();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
			await page.getByTestId("menubar-trigger-1").click();
			await expect(page.getByTestId("menubar-list-1")).toBeVisible();
			await expect(page.getByTestId("menubar-item-1-1")).not.toBeFocused();
		});

		test("hovering an adjacent trigger switches the open menu", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").click();
			await page.getByTestId("menubar-trigger-2").hover();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
			await expect(page.getByTestId("menubar-list-2")).toBeVisible();
		});

		test("hovering a non-adjacent trigger also switches the open menu", async ({
			page,
		}) => {
			await page.getByTestId("menubar-trigger-1").click();
			await page.getByTestId("menubar-trigger-3").hover();
			await expect(page.getByTestId("menubar-list-1")).not.toBeVisible();
			await expect(page.getByTestId("menubar-list-3")).toBeVisible();
		});
	});
});

test.describe("Separate and mixed menus", () => {
	test("separate root menus do not switch on hover", async ({
		page,
		renderer,
	}) => {
		await page.goto(`/${renderer}/menu/separate`);
		await page.getByTestId("menu-a-trigger").click();
		await page.getByTestId("menu-b-trigger").hover();
		await expect(page.getByTestId("menu-b-list")).not.toBeVisible();
		await expect(page.getByTestId("menu-a-list")).toBeVisible();

		await page.getByTestId("menu-b-trigger").dispatchEvent("click");
		await expect(page.getByTestId("menu-a-list")).not.toBeVisible();
		await expect(page.getByTestId("menu-b-list")).toBeVisible();

		// Symmetry: with menu B open, hovering menu A's trigger must not open A.
		await page.getByTestId("menu-a-trigger").hover();
		await expect(page.getByTestId("menu-a-list")).not.toBeVisible();
		await expect(page.getByTestId("menu-b-list")).toBeVisible();
	});

	test("hover-switch is scoped: standalone dropdown ↔ menubar, menubar A ↔ menubar B do not auto-switch", async ({
		page,
		renderer,
	}) => {
		await page.goto(`/${renderer}/menu/mixed`);
		await page.getByTestId("dropdown-trigger").click();
		await page.getByTestId("menubar-a-trigger-1").hover();
		await expect(page.getByTestId("menubar-a-list-1")).not.toBeVisible();
		await expect(page.getByTestId("dropdown-list")).toBeVisible();
		await page.keyboard.press("Escape");

		await page.getByTestId("menubar-a-trigger-1").click();
		await page.getByTestId("menubar-b-trigger-1").hover();
		await expect(page.getByTestId("menubar-b-list-1")).not.toBeVisible();
		await expect(page.getByTestId("menubar-a-list-1")).toBeVisible();

		// Same-menubar hover still switches.
		await page.getByTestId("menubar-a-trigger-2").hover();
		await expect(page.getByTestId("menubar-a-list-1")).not.toBeVisible();
		await expect(page.getByTestId("menubar-a-list-2")).toBeVisible();
	});
});

test.describe("Menu inside a collapsible sidebar", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/nested-content`);
	});

	for (const [key, expected] of [
		["ArrowDown", "nested-menu-item-1"],
		["ArrowUp", "nested-menu-item-3"],
		["Enter", "nested-menu-item-1"],
		["Space", "nested-menu-item-1"],
	] as const) {
		test(`${key} opens the nested menu with focus on ${expected}`, async ({
			page,
		}) => {
			await page.getByTestId("nested-menu-trigger").focus();
			await page.getByTestId("nested-menu-trigger").press(key);
			await expect(page.getByTestId("nested-menu-list")).toBeVisible();
			await expect(page.getByTestId(expected)).toBeFocused();
		});
	}

	test("ArrowDown on the trigger does not scroll the surrounding sidebar", async ({
		page,
	}) => {
		await page.getByTestId("nested-menu-trigger").focus();
		const before = await page
			.getByTestId("sidebar")
			.evaluate((el) => el.scrollTop);
		await page.keyboard.press("ArrowDown");
		const after = await page
			.getByTestId("sidebar")
			.evaluate((el) => el.scrollTop);
		expect(after).toBe(before);
	});
});

test.describe("Safety triangle", () => {
	type PointerOpts = {
		testId: string;
		x: number;
		y: number;
		movementX?: number;
		movementY?: number;
		pointerType?: string;
	};

	const pointer = (page: Page, opts: PointerOpts) =>
		page.evaluate((o) => {
			const el = document.querySelector(`[data-testid="${o.testId}"]`);
			if (el)
				el.dispatchEvent(
					new PointerEvent("pointermove", {
						clientX: o.x,
						clientY: o.y,
						movementX: o.movementX ?? 0,
						movementY: o.movementY ?? 0,
						pointerType: o.pointerType ?? "mouse",
						bubbles: true,
					}),
				);
		}, opts);

	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/triangle`);
		await page.getByTestId("trigger").click();
		await page.getByTestId("submenu-trigger").hover();
		await expect(page.getByTestId("submenu-list")).toBeVisible();
	});

	test("cursor inside trigger rect sets `data-safe` and updates CSS vars", async ({
		page,
	}) => {
		const rect = await page.getByTestId("submenu-trigger").boundingBox();
		if (!rect) throw new Error("submenu-trigger not visible");
		const cx = rect.x + rect.width / 2;
		const cy = rect.y + rect.height / 2;
		await pointer(page, {
			testId: "submenu-trigger",
			x: cx,
			y: cy,
			movementX: 1,
		});
		await expect(page.getByTestId("group")).toHaveAttribute("data-safe", "");
		const y = await page
			.getByTestId("group")
			.evaluate((el) => el.style.getPropertyValue("--y"));
		expect(y).toBe(`${cy}px`);
	});

	test("sustained velocity away from the submenu clears `data-safe`", async ({
		page,
	}) => {
		const rect = await page.getByTestId("submenu-trigger").boundingBox();
		if (!rect) throw new Error("submenu-trigger not visible");
		await pointer(page, {
			testId: "submenu-trigger",
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		});
		for (let i = 0; i < 5; i++) {
			await pointer(page, {
				testId: "group",
				x: rect.x - 10,
				y: rect.y + rect.height / 2,
				movementX: -5,
			});
		}
		await expect(page.getByTestId("group")).not.toHaveAttribute("data-safe");
	});

	test("cursor leaving the triangle area (different element) clears `data-safe`", async ({
		page,
	}) => {
		const rect = await page.getByTestId("submenu-trigger").boundingBox();
		if (!rect) throw new Error("submenu-trigger not visible");
		await pointer(page, {
			testId: "submenu-trigger",
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		});
		await pointer(page, {
			testId: "item-1",
			x: rect.x - 50,
			y: rect.y - 30,
		});
		await expect(page.getByTestId("group")).not.toHaveAttribute("data-safe");
	});

	test("touch pointer events are ignored", async ({ page }) => {
		const rect = await page.getByTestId("submenu-trigger").boundingBox();
		if (!rect) throw new Error("submenu-trigger not visible");
		await pointer(page, {
			testId: "submenu-trigger",
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
			movementX: 1,
			pointerType: "touch",
		});
		await expect(page.getByTestId("group")).not.toHaveAttribute("data-safe");
	});

	test("reopens cleanly: closing the submenu and re-opening still tracks the cursor", async ({
		page,
	}) => {
		const rect = await page.getByTestId("submenu-trigger").boundingBox();
		if (!rect) throw new Error("submenu-trigger not visible");
		await page.getByTestId("item-1").hover();
		await expect(page.getByTestId("submenu-list")).not.toBeVisible();
		await page.getByTestId("submenu-trigger").hover();
		await expect(page.getByTestId("submenu-list")).toBeVisible();
		await pointer(page, {
			testId: "submenu-trigger",
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
			movementX: -1,
		});
		await expect(page.getByTestId("group")).toHaveAttribute("data-safe", "");
	});
});

test.describe("Checkbox and radio items", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/checkbox-radio`);
		await page.getByTestId("trigger").click();
	});

	test("declares the menuitemcheckbox / menuitemradio / separator roles and initial `aria-checked`", async ({
		page,
	}) => {
		await expect(page.getByTestId("checkbox-1")).toHaveAttribute(
			"role",
			"menuitemcheckbox",
		);
		await expect(page.getByTestId("checkbox-1")).toHaveAttribute(
			"aria-checked",
			"false",
		);
		await expect(page.getByTestId("checkbox-2")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(page.getByTestId("checkbox-disabled")).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		await expect(page.getByTestId("radio-a1")).toHaveAttribute(
			"role",
			"menuitemradio",
		);
		await expect(page.getByTestId("radio-a1")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(page.getByTestId("radio-a2")).toHaveAttribute(
			"aria-checked",
			"false",
		);
		await expect(page.getByTestId("radio-a3")).toHaveAttribute(
			"aria-checked",
			"false",
		);
		await expect(page.getByTestId("separator-1")).toHaveAttribute(
			"role",
			"separator",
		);
		await expect(page.getByTestId("separator-2")).toHaveAttribute(
			"role",
			"separator",
		);
	});

	for (const activation of ["click", "Enter", "Space"] as const) {
		test(`${activation} toggles a checkbox without closing the menu`, async ({
			page,
		}) => {
			if (activation === "click") {
				await page.getByTestId("checkbox-1").click();
			} else {
				await page.getByTestId("checkbox-1").focus();
				await page.keyboard.press(activation);
			}
			await expect(page.getByTestId("checkbox-1")).toHaveAttribute(
				"aria-checked",
				"true",
			);
			await expect(page.getByTestId("list")).toBeVisible();
		});

		test(`${activation} selects a radio and unchecks same-group siblings without closing the menu`, async ({
			page,
		}) => {
			if (activation === "click") {
				await page.getByTestId("radio-a2").click();
			} else {
				await page.getByTestId("radio-a2").focus();
				await page.keyboard.press(activation);
			}
			await expect(page.getByTestId("radio-a2")).toHaveAttribute(
				"aria-checked",
				"true",
			);
			await expect(page.getByTestId("radio-a1")).toHaveAttribute(
				"aria-checked",
				"false",
			);
			await expect(page.getByTestId("list")).toBeVisible();
		});
	}

	test("re-clicking a checked checkbox unchecks it", async ({ page }) => {
		await page.getByTestId("checkbox-2").click();
		await expect(page.getByTestId("checkbox-2")).toHaveAttribute(
			"aria-checked",
			"false",
		);
	});

	test("a separator scopes the radio group: changing one group does not affect the other", async ({
		page,
	}) => {
		await page.getByTestId("radio-a2").click();
		await expect(page.getByTestId("radio-b1")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(page.getByTestId("radio-b2")).toHaveAttribute(
			"aria-checked",
			"false",
		);
	});

	test("selecting an earlier radio clears a later checked sibling", async ({
		page,
	}) => {
		await page.getByTestId("radio-a2").click();
		await page.getByTestId("radio-a1").click();
		await expect(page.getByTestId("radio-a1")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(page.getByTestId("radio-a2")).toHaveAttribute(
			"aria-checked",
			"false",
		);
	});

	test("radio sweep survives a boundary left behind by arrow navigation", async ({
		page,
	}) => {
		// ArrowDown past the disabled checkbox and separator records a
		// roving boundary; the subsequent mouse-click sweep must start
		// with a fresh one or it bails before clearing `radio-a1`.
		await page.getByTestId("checkbox-2").focus();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("radio-a1")).toBeFocused();
		await page.getByTestId("radio-a2").click();
		await expect(page.getByTestId("radio-a2")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(page.getByTestId("radio-a1")).toHaveAttribute(
			"aria-checked",
			"false",
		);
	});

	test("a radio whose button is not the first child of its `li` still checks", async ({
		page,
		renderer,
	}) => {
		test.skip(
			renderer !== "html",
			"Structure edge case; wrappers emit the canonical shape",
		);
		await page.goto("/html/menu/radio-wrapped");
		await page.getByTestId("trigger").click();
		await page.getByTestId("radio-2").click();
		await expect(page.getByTestId("radio-2")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(page.getByTestId("list")).toBeVisible();
	});

	test("arrow navigation skips disabled items and separators", async ({
		page,
	}) => {
		await page.getByTestId("checkbox-2").focus();
		await page.keyboard.press("ArrowDown");
		// Skips the disabled checkbox AND the separator
		await expect(page.getByTestId("radio-a1")).toBeFocused();
		await page.keyboard.press("ArrowUp");
		// Skips the separator AND the disabled checkbox on the way back
		await expect(page.getByTestId("checkbox-2")).toBeFocused();
	});

	test("arrow navigation steps through enabled checkboxes and radios", async ({
		page,
	}) => {
		await page.getByTestId("checkbox-1").focus();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("checkbox-2")).toBeFocused();

		await page.getByTestId("radio-a1").focus();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("radio-a2")).toBeFocused();
	});

	test("activating a regular menuitem still closes the menu", async ({
		page,
	}) => {
		await page.getByTestId("regular-item").click();
		await expect(page.getByTestId("list")).not.toBeVisible();
	});
});

test.describe("Click handler", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/basic`);
	});

	for (const target of ["trigger", "item", "checkbox", "radio-2"] as const) {
		for (const activation of ["click", "Enter", "Space"] as const) {
			test(`${target} fires on ${activation}`, async ({ page }) => {
				if (target !== "trigger") await page.getByTestId("trigger").click();
				const el = page.getByTestId(target);
				if (activation === "click") {
					await el.click();
				} else {
					await el.focus();
					await page.keyboard.press(activation);
				}
				await expect(page.getByTestId("output")).toHaveText(
					`${target}-clicked`,
				);
			});
		}
	}
});

test.describe("Dynamic", () => {
	test("handles dynamic items, submenu, checkbox, radio, disabled, href, label, separator, and multi-instance", async ({
		page,
		renderer,
	}) => {
		await page.goto(`/${renderer}/menu/dynamic`);

		await page.getByTestId("trigger").click();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("item-1")).toBeFocused();
		await page.keyboard.press("Escape");

		await page.getByTestId("add-item").click();
		await page.getByTestId("trigger").click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("item-4")).toBeFocused();
		await page.keyboard.press("Escape");

		await page.getByTestId("remove-item").click();
		await page.getByTestId("remove-item").click();
		await page.getByTestId("trigger").click();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("item-1")).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("item-2")).toBeFocused();
		await page.keyboard.press("Escape");

		await page.getByTestId("add-submenu").click();
		await page.getByTestId("trigger").click();
		await page.keyboard.press("ArrowDown");
		const focused = page.getByTestId("submenu-trigger");
		while (!(await focused.evaluate((el) => el === document.activeElement))) {
			await page.keyboard.press("ArrowDown");
		}
		await page.keyboard.press("ArrowRight");
		await expect(page.getByTestId("submenu-list")).toBeVisible();
		await expect(page.getByTestId("submenu-item-1")).toBeFocused();
		await page.keyboard.press("Escape");
		await page.keyboard.press("Escape");

		await page.getByTestId("trigger").click();
		await page.getByTestId("item-1").click();
		await expect(page.getByTestId("output")).toHaveText("item-1-clicked");

		await page.getByTestId("trigger").click();
		const hrefItem = page.getByTestId("item-href");
		await expect(hrefItem).toHaveRole("menuitem");
		await expect(hrefItem).toHaveAttribute("href", "https://example.com");
		await expect(hrefItem).toHaveJSProperty("tagName", "A");
		await page.keyboard.press("Escape");

		await page.getByTestId("trigger").click();
		await expect(page.getByTestId("label")).toHaveRole("presentation");
		await expect(page.getByTestId("separator")).toHaveRole("separator");
		await page.keyboard.press("Escape");

		await page.getByTestId("trigger").click();
		const checkboxItem = page.getByTestId("checkbox-item");
		await expect(checkboxItem).toHaveRole("menuitemcheckbox");
		await expect(checkboxItem).toHaveAttribute("aria-checked", "false");
		await page.keyboard.press("Escape");
		await page.getByTestId("toggle-checked").click();
		await page.getByTestId("trigger").click();
		await expect(checkboxItem).toHaveAttribute("aria-checked", "true");
		await page.keyboard.press("Escape");

		await page.getByTestId("trigger").click();
		await expect(page.getByTestId("radio-a")).toHaveRole("menuitemradio");
		await expect(page.getByTestId("radio-a")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await page.keyboard.press("Escape");
		await page.getByTestId("select-radio-b").click();
		await page.getByTestId("trigger").click();
		await expect(page.getByTestId("radio-a")).toHaveAttribute(
			"aria-checked",
			"false",
		);
		await expect(page.getByTestId("radio-b")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await page.keyboard.press("Escape");

		await page.getByTestId("toggle-disabled").click();
		await page.getByTestId("trigger").click();
		await expect(page.getByTestId("item-2")).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("item-1")).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("item-2")).not.toBeFocused();
		await page.keyboard.press("Escape");

		await page.getByTestId("menu2-trigger").click();
		await expect(page.getByTestId("menu2-list")).toBeVisible();
		await expect(page.getByTestId("list")).not.toBeVisible();
		await page.keyboard.press("Escape");
	});
});

test.describe("Structure independence", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/structure-independence`);
	});

	test("opens a menu where trigger and popover are bare siblings (no wrapper)", async ({
		page,
	}) => {
		await page.getByTestId("a-trigger").click();
		await expect(page.getByTestId("a-list")).toBeVisible();
		await expect(page.getByTestId("a-trigger")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("a-item-1")).toBeFocused();
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("a-list")).not.toBeVisible();
	});

	test("opens a menu where trigger and popover are separated by unrelated DOM", async ({
		page,
	}) => {
		await page.getByTestId("b-trigger").click();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("b-item-1")).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("b-item-2")).toBeFocused();
	});

	test("opens a menu (and its submenu) when trigger and popover live in different containers", async ({
		page,
	}) => {
		await page.getByTestId("c-trigger").click();
		await expect(page.getByTestId("c-list")).toBeVisible();
		// Hovering an item in the remotely-placed popover keeps the menu
		// open; the runtime resolves the trigger via aria-labelledby, not
		// DOM walking.
		await page.getByTestId("c-item-1").hover();
		await expect(page.getByTestId("c-list")).toBeVisible();

		// The submenu's popover lives in a sibling <footer>, not next to
		// its trigger; the runtime resolves it via aria-controls regardless.
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await expect(page.getByTestId("c-submenu-trigger")).toBeFocused();
		await page.keyboard.press("ArrowRight");
		await expect(page.getByTestId("c-submenu-list")).toBeVisible();
		await expect(page.getByTestId("c-sub-item-1")).toBeFocused();
	});

	test("an outside click dismisses a menu with a remotely-placed popover", async ({
		page,
	}) => {
		await page.getByTestId("c-trigger").click();
		// Click on unrelated chrome sitting between the trigger and popover
		// in DOM order. With the firstElementChild-based hover detection we
		// used to have, this could mis-resolve; with the aria-labelledby
		// lookup it is just an outside click.
		await page.getByTestId("main-c").click();
		await expect(page.getByTestId("c-list")).not.toBeVisible();
	});
});

test.describe("Disabled trigger", () => {
	test.beforeEach(async ({ page, renderer }) => {
		await page.goto(`/${renderer}/menu/disabled-trigger`);
	});

	test("declares `aria-disabled` on the trigger", async ({ page }) => {
		await expect(page.getByTestId("trigger")).toHaveAttribute(
			"aria-disabled",
			"true",
		);
	});

	test("mouse click does not open the menu", async ({ page }) => {
		await page.getByTestId("trigger").click({ force: true });
		await expect(page.getByTestId("list")).not.toBeVisible();
		await expect(page.getByTestId("trigger")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	});

	test("Enter, ArrowDown, and ArrowUp do not open the menu", async ({
		page,
	}) => {
		await page.getByTestId("trigger").focus();
		for (const key of ["Enter", "ArrowDown", "ArrowUp"]) {
			await page.keyboard.press(key);
			await expect(page.getByTestId("list")).not.toBeVisible();
		}
	});
});
