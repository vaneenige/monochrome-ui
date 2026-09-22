import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// The stub records the call and does not run the callback. The DOM
// update has to be inside startViewTransition, so it stays pending
// until the test flushes.
const deferTransitions = (page: Page) =>
  page.evaluate(() => {
    const calls: string[] = [];
    const pending: (() => void)[] = [];
    window.__vtCalls = calls;
    window.__vtFlush = () => {
      const batch = pending.splice(0);
      for (const fn of batch) fn();
    };
    const stub = (kind: string) =>
      function (update?: () => void) {
        calls.push(kind);
        if (typeof update === "function") pending.push(update);
      };
    for (const [proto, kind] of [
      [Document.prototype, "viewport"],
      [Element.prototype, "element"],
    ] as const) {
      Reflect.defineProperty(proto, "startViewTransition", {
        configurable: true,
        writable: true,
        value: stub(kind),
      });
    }
  });

const flushTransitions = (page: Page) => page.evaluate(() => window.__vtFlush?.());

const transitionCalls = (page: Page) => page.evaluate(() => window.__vtCalls ?? []);

const hideTransition = (page: Page, kind: "viewport" | "element") =>
  page.evaluate((kind) => {
    const proto = kind === "viewport" ? Document.prototype : Element.prototype;
    Reflect.defineProperty(proto, "startViewTransition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  }, kind);

const mark = (page: Page, testId: string, value: string) =>
  page.getByTestId(testId).evaluate((el, value) => {
    el.setAttribute("data-view-transition", value);
  }, value);

const markAncestor = (page: Page, testId: string, prefix: string, value: string) =>
  page.getByTestId(testId).evaluate(
    (el, { prefix, value }) => {
      let node: Element | null = el;
      while (node && !node.id.startsWith(prefix)) node = node.parentElement;
      node?.setAttribute("data-view-transition", value);
    },
    { prefix, value },
  );

test.describe("View transitions", () => {
  test("leaves a dialog instant when `data-view-transition` is absent", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await deferTransitions(page);
    await page.getByTestId("primary-trigger").click();
    await expect(page.getByTestId("primary-content")).toBeVisible();
    expect(await transitionCalls(page)).toEqual([]);
  });

  test("`viewport` defers a dialog open to the document callback", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await mark(page, "primary-content", "viewport");
    await deferTransitions(page);
    await page.getByTestId("primary-trigger").click();
    expect(await transitionCalls(page)).toEqual(["viewport"]);
    await expect(page.getByTestId("primary-content")).not.toBeVisible();
    await flushTransitions(page);
    await expect(page.getByTestId("primary-content")).toBeVisible();
    expect(await transitionCalls(page)).toEqual(["viewport"]);
  });

  test("`element` defers a tab change to the element callback", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/tabs/horizontal`);
    await markAncestor(page, "tab-1", "mcr:tabs:", "element");
    await deferTransitions(page);
    await page.getByTestId("tab-2").click();
    expect(await transitionCalls(page)).toEqual(["element"]);
    await expect(page.getByTestId("panel-2")).toHaveAttribute("hidden", "");
    await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "false");
    await flushTransitions(page);
    await expect(page.getByTestId("panel-2")).not.toHaveAttribute("hidden");
    await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
  });

  test("`element` does not fall back to a document view transition", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/tabs/horizontal`);
    await markAncestor(page, "tab-1", "mcr:tabs:", "element");
    await deferTransitions(page);
    await hideTransition(page, "element");
    await page.getByTestId("tab-2").click();
    await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("panel-2")).not.toHaveAttribute("hidden");
    expect(await transitionCalls(page)).toEqual([]);
  });

  test("`viewport` skips the element method when the document method is missing", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await mark(page, "primary-content", "viewport");
    await deferTransitions(page);
    await hideTransition(page, "viewport");
    await page.getByTestId("primary-trigger").click();
    await expect(page.getByTestId("primary-content")).toBeVisible();
    expect(await transitionCalls(page)).toEqual([]);
  });

  test("batches an accordion close and open into one view transition", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/accordion/single`);
    await page.getByTestId("single-trigger-1").click();
    await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "true");
    await markAncestor(page, "single-trigger-1", "mcr:accordion:", "viewport");
    await deferTransitions(page);
    await page.getByTestId("single-trigger-2").click();
    expect(await transitionCalls(page)).toEqual(["viewport"]);
    await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("single-trigger-2")).toHaveAttribute("aria-expanded", "false");
    await flushTransitions(page);
    await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("single-trigger-2")).toHaveAttribute("aria-expanded", "true");
    expect(await transitionCalls(page)).toEqual(["viewport"]);
  });

  test("still toggles a collapsible when the value is unknown", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/collapsible/basic`);
    await mark(page, "collapsible-content", "slide");
    await deferTransitions(page);
    await page.getByTestId("collapsible-trigger").click();
    await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("collapsible-content")).not.toHaveAttribute("hidden");
    expect(await transitionCalls(page)).toEqual([]);
  });

  test("uses the nearest `data-view-transition` value", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    await page.getByTestId("primary-content").evaluate((el) => {
      el.setAttribute("data-view-transition", "element");
      el.parentElement?.setAttribute("data-view-transition", "viewport");
    });
    await deferTransitions(page);
    await page.getByTestId("primary-trigger").click();
    expect(await transitionCalls(page)).toEqual(["element"]);
    await expect(page.getByTestId("primary-content")).not.toBeVisible();
    await flushTransitions(page);
    await expect(page.getByTestId("primary-content")).toBeVisible();
  });

  test("mirrors `aria-expanded` before a deferred collapsible paint", async ({
    page,
    renderer,
  }) => {
    await page.goto(`/${renderer}/collapsible/basic`);
    await mark(page, "collapsible-content", "element");
    await deferTransitions(page);
    await page.getByTestId("collapsible-trigger").click();
    expect(await transitionCalls(page)).toEqual(["element"]);
    await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("collapsible-content")).toHaveAttribute("hidden", "");
    await flushTransitions(page);
    await expect(page.getByTestId("collapsible-content")).not.toHaveAttribute("hidden");
  });

  test("`viewport` on a menu starts one document view transition", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/menu/basic`);
    await mark(page, "root-list", "viewport");
    await deferTransitions(page);
    await page.getByTestId("root-trigger").click();
    expect(await transitionCalls(page)).toEqual(["viewport"]);
    await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "false");
    await flushTransitions(page);
    await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "true");
  });

  test("opens a dialog through the document view transition", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/dialog/basic`);
    const supported = await page.evaluate(() => "startViewTransition" in document);
    test.skip(!supported, "no document view transition");
    await mark(page, "primary-content", "viewport");
    await page.getByTestId("primary-trigger").click();
    await expect(page.getByTestId("primary-content")).toBeVisible();
  });

  test("selects a tab through the element view transition", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/tabs/horizontal`);
    const supported = await page.evaluate(
      () => "startViewTransition" in document.createElement("div"),
    );
    test.skip(!supported, "no element view transition");
    await markAncestor(page, "tab-1", "mcr:tabs:", "element");
    await page.getByTestId("tab-2").click();
    await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("panel-2")).not.toHaveAttribute("hidden");
  });

  test("positions a popover opened in a document view transition", async ({ page, renderer }) => {
    await page.goto(`/${renderer}/popover/basic`);
    const supported = await page.evaluate(() => "startViewTransition" in document);
    test.skip(!supported, "no document view transition");
    await mark(page, "click-content", "viewport");
    const trigger = page.getByTestId("click-trigger");
    await trigger.click();
    const content = page.getByTestId("click-content");
    await expect(content).toBeVisible();
    const top = await content.evaluate((el) => el.style.getPropertyValue("--top"));
    const triggerTop = await trigger.evaluate((el) => `${el.getBoundingClientRect().top}px`);
    expect(top).toBe(triggerTop);
  });
});
