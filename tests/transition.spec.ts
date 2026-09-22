import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// The stub records each call and holds the callback, so a test can
// observe the state before the browser would run the update.
const deferTransitions = (page: Page) =>
  page.evaluate(() => {
    const calls: string[] = [];
    const skips: string[] = [];
    const pending: (() => void)[] = [];
    window.__vtCalls = calls;
    window.__vtSkips = skips;
    window.__vtFlush = () => {
      for (const run of pending.splice(0)) run();
    };
    const stub = (kind: string) =>
      function (update: () => void) {
        calls.push(kind);
        let settle = () => {};
        const finished = new Promise<void>((resolve) => {
          settle = resolve;
        });
        pending.push(() => {
          update();
          settle();
        });
        return Object.create(ViewTransition.prototype, {
          finished: { value: finished },
          ready: { value: Promise.resolve() },
          skipTransition: { value: () => skips.push(kind) },
        });
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
const transitionSkips = (page: Page) => page.evaluate(() => window.__vtSkips ?? []);

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

const isOpen = (page: Page, testId: string) =>
  page.getByTestId(testId).evaluate((el) => el instanceof HTMLDialogElement && el.open);

const supports = (page: Page, kind: "viewport" | "element") =>
  page.evaluate(
    (kind) =>
      "startViewTransition" in (kind === "viewport" ? document : document.createElement("div")),
    kind,
  );

const slowTransitions = (page: Page) =>
  page.addStyleTag({
    content: `::view-transition-group(*), ::view-transition-old(*),
      ::view-transition-new(*) { animation-duration: 600ms; }`,
  });

const trackTransitions = (page: Page) =>
  page.evaluate(() => {
    const finished: Promise<void>[] = [];
    window.__vtFinished = finished;
    const start = Document.prototype.startViewTransition;
    Document.prototype.startViewTransition = function (update) {
      const transition = start.call(this, update);
      finished.push(transition.finished);
      return transition;
    };
  });

// Waits until every transition, including any a handler starts while
// an earlier one settles, has finished.
const settleTransitions = (page: Page) =>
  page.evaluate(async () => {
    const finished = window.__vtFinished ?? [];
    let seen = -1;
    while (seen !== finished.length) {
      seen = finished.length;
      await Promise.allSettled(finished);
      await new Promise(requestAnimationFrame);
    }
  });

const waitForTransition = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (
            document
              .getAnimations()
              .some((a) => a.effect instanceof KeyframeEffect && a.effect.pseudoElement)
          )
            resolve();
          else requestAnimationFrame(check);
        };
        check();
      }),
  );

test.describe("View transitions", () => {
  test.describe("Initial state", () => {
    test("runs updates instantly without `data-view-transition`", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await deferTransitions(page);
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("primary-content")).toBeVisible();
      expect(await transitionCalls(page)).toEqual([]);
    });

    test("`none` opts a subtree out of an ancestor's transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
      await page.getByTestId("collapsible-content").evaluate((el) => {
        el.setAttribute("data-view-transition", "none");
        el.parentElement?.setAttribute("data-view-transition", "viewport");
      });
      await deferTransitions(page);
      await page.getByTestId("collapsible-trigger").click();
      await expect(page.getByTestId("collapsible-content")).toBeVisible();
      expect(await transitionCalls(page)).toEqual([]);
    });

    test("Menu and Tooltip ignore `data-view-transition`", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/menu/basic`);
      await page.evaluate(() => document.body.setAttribute("data-view-transition", "viewport"));
      await deferTransitions(page);
      await page.getByTestId("root-trigger").click();
      await expect(page.getByTestId("root-trigger")).toHaveAttribute("aria-expanded", "true");
      expect(await transitionCalls(page)).toEqual([]);
    });
  });

  test.describe("Activation", () => {
    test("`viewport` holds a dialog open for the document callback", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await mark(page, "primary-content", "viewport");
      await deferTransitions(page);
      await page.getByTestId("primary-trigger").click();
      expect(await transitionCalls(page)).toEqual(["viewport"]);
      expect(await isOpen(page, "primary-content")).toBe(false);
      await flushTransitions(page);
      await expect(page.getByTestId("primary-content")).toBeVisible();
    });

    test("`element` holds a tab change for the element callback", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
      await markAncestor(page, "tab-1", "mcr:tabs:", "element");
      await deferTransitions(page);
      await page.getByTestId("tab-2").click();
      expect(await transitionCalls(page)).toEqual(["element"]);
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "false");
      await expect(page.getByTestId("panel-2")).toHaveAttribute("hidden", "");
      await flushTransitions(page);
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("panel-2")).not.toHaveAttribute("hidden");
    });

    test("`element` never falls back to a document transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
      await markAncestor(page, "tab-1", "mcr:tabs:", "element");
      await deferTransitions(page);
      await hideTransition(page, "element");
      await page.getByTestId("tab-2").click();
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      expect(await transitionCalls(page)).toEqual([]);
    });

    test("`viewport` never falls back to an element transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await mark(page, "primary-content", "viewport");
      await deferTransitions(page);
      await hideTransition(page, "viewport");
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("primary-content")).toBeVisible();
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
    });

    test("runs an accordion close and open as one transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/accordion/single`);
      await page.getByTestId("single-trigger-1").click();
      await markAncestor(page, "single-trigger-1", "mcr:accordion:", "viewport");
      await deferTransitions(page);
      await page.getByTestId("single-trigger-2").click();
      expect(await transitionCalls(page)).toEqual(["viewport"]);
      await flushTransitions(page);
      await expect(page.getByTestId("single-trigger-1")).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByTestId("single-trigger-2")).toHaveAttribute("aria-expanded", "true");
      expect(await transitionCalls(page)).toEqual(["viewport"]);
    });

    test("keeps `aria-expanded` and `hidden` in step on a collapsible", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
      await mark(page, "collapsible-content", "element");
      await deferTransitions(page);
      await page.getByTestId("collapsible-trigger").click();
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(page.getByTestId("collapsible-content")).toHaveAttribute("hidden", "");
      await flushTransitions(page);
      await expect(page.getByTestId("collapsible-trigger")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(page.getByTestId("collapsible-content")).not.toHaveAttribute("hidden");
    });
  });

  test.describe("Keyboard", () => {
    test("a key applies the pending update before any handler runs", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/popover/basic`);
      await mark(page, "click-content", "viewport");
      await deferTransitions(page);
      await page.getByTestId("click-trigger").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
      expect(await transitionSkips(page)).toEqual(["viewport"]);
      await flushTransitions(page);
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("click-trigger")).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByTestId("click-trigger")).toBeFocused();
    });

    test("Enter then Escape closes a popover with the real API", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/popover/basic`);
      test.skip(!(await supports(page, "viewport")), "no document view transition");
      await mark(page, "click-content", "viewport");
      await trackTransitions(page);
      await page.getByTestId("click-trigger").evaluate((el) => {
        if (el instanceof HTMLElement) el.click();
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
      await settleTransitions(page);
      await expect(page.getByTestId("click-content")).not.toBeVisible();
      await expect(page.getByTestId("click-trigger")).toHaveAttribute("aria-expanded", "false");
    });

    test("Tab right after opening a dialog stays inside it", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await mark(page, "primary-content", "viewport");
      await deferTransitions(page);
      await page.getByTestId("primary-trigger").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Tab");
      await flushTransitions(page);
      expect(await isOpen(page, "primary-content")).toBe(true);
      await expect(page.getByTestId("primary-action")).toBeFocused();
    });
  });

  test.describe("Mouse", () => {
    test("a press on the transition overlay keeps a popover open", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/popover/basic`);
      test.skip(!(await supports(page, "viewport")), "no document view transition");
      await slowTransitions(page);
      await mark(page, "click-content", "viewport");
      await trackTransitions(page);
      await page.getByTestId("click-trigger").click();
      await waitForTransition(page);
      await page.getByTestId("click-text").click({ force: true });
      await settleTransitions(page);
      await expect(page.getByTestId("click-content")).toBeVisible();
      await expect(page.getByTestId("click-trigger")).toHaveAttribute("aria-expanded", "true");
    });

    test("a press on the transition overlay keeps focus in the dialog", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      test.skip(!(await supports(page, "viewport")), "no document view transition");
      await slowTransitions(page);
      await mark(page, "primary-content", "viewport");
      await trackTransitions(page);
      await page.getByTestId("primary-trigger").click();
      await waitForTransition(page);
      await page.mouse.click(5, 5);
      await settleTransitions(page);
      const inside = await page
        .getByTestId("primary-content")
        .evaluate((el) => el.contains(document.activeElement));
      expect(inside).toBe(true);
    });
  });

  test.describe("Dismissal", () => {
    test("Escape closes a dialog through the transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await mark(page, "primary-content", "viewport");
      await deferTransitions(page);
      await page.getByTestId("primary-trigger").click();
      await flushTransitions(page);
      await page.keyboard.press("Escape");
      expect(await transitionCalls(page)).toEqual(["viewport", "viewport"]);
      expect(await isOpen(page, "primary-content")).toBe(true);
      await flushTransitions(page);
      expect(await isOpen(page, "primary-content")).toBe(false);
      await expect(page.getByTestId("primary-trigger")).toBeFocused();
    });

    test("Escape leaves a dialog to the browser without the attribute", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await deferTransitions(page);
      await page.getByTestId("primary-trigger").click();
      await page.keyboard.press("Escape");
      expect(await isOpen(page, "primary-content")).toBe(false);
      expect(await transitionCalls(page)).toEqual([]);
    });

    test("a consumer `cancel` listener still keeps the dialog open", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/dialog/basic`);
      await mark(page, "primary-content", "viewport");
      await page.getByTestId("primary-content").evaluate((el) => {
        el.addEventListener("cancel", (event) => event.preventDefault());
      });
      await deferTransitions(page);
      await page.getByTestId("primary-trigger").click();
      await flushTransitions(page);
      await page.keyboard.press("Escape");
      await flushTransitions(page);
      expect(await isOpen(page, "primary-content")).toBe(true);
      expect(await transitionCalls(page)).toEqual(["viewport"]);
    });

    test('a `method="dialog"` form closes through the transition', async ({ page, renderer }) => {
      test.skip(renderer !== "html", "HTML form fixture");
      await page.goto("/html/dialog/form");
      await mark(page, "content", "viewport");
      await page.getByTestId("submit").evaluate((el) => el.setAttribute("value", "confirmed"));
      await deferTransitions(page);
      await page.getByTestId("trigger").click();
      await flushTransitions(page);
      await page.getByTestId("submit").click();
      expect(await transitionCalls(page)).toEqual(["viewport", "viewport"]);
      expect(await isOpen(page, "content")).toBe(true);
      await flushTransitions(page);
      expect(await isOpen(page, "content")).toBe(false);
      const value = await page
        .getByTestId("content")
        .evaluate((el) => el instanceof HTMLDialogElement && el.returnValue);
      expect(value).toBe("confirmed");
      await expect(page.getByTestId("trigger")).toBeFocused();
    });

    test("a card morphs into the dialog and back with the real API", async ({ page, renderer }) => {
      test.skip(renderer !== "html", "sibling selector fits the HTML fixture");
      await page.goto("/html/dialog/basic");
      test.skip(!(await supports(page, "viewport")), "no document view transition");
      await page.addStyleTag({
        content: `[data-testid="primary-trigger"]:has(+ dialog:not([open])),
          [data-testid="primary-content"][open] { view-transition-name: card; }`,
      });
      await mark(page, "primary-content", "viewport");
      await page.evaluate(() => {
        const log: string[] = [];
        window.__vtCalls = log;
        const start = Document.prototype.startViewTransition;
        Document.prototype.startViewTransition = function (update) {
          const transition = start.call(this, update);
          void transition.ready.then(
            () => {
              const names = document
                .getAnimations()
                .map((a) => (a.effect instanceof KeyframeEffect ? a.effect.pseudoElement : null));
              log.push(names.includes("::view-transition-group(card)") ? "morph" : "no morph");
            },
            () => log.push("skipped"),
          );
          return transition;
        };
      });
      await page.getByTestId("primary-trigger").click();
      await expect(page.getByTestId("primary-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("primary-content")).not.toBeVisible();
      await expect.poll(() => transitionCalls(page)).toEqual(["morph", "morph"]);
    });
  });

  test.describe("Edge cases", () => {
    test("reduced motion runs updates instantly", async ({ page, renderer }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${renderer}/tabs/horizontal`);
      await markAncestor(page, "tab-1", "mcr:tabs:", "element");
      await deferTransitions(page);
      await page.getByTestId("tab-2").click();
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      expect(await transitionCalls(page)).toEqual([]);
    });

    test("a throwing `startViewTransition` still applies every update", async ({
      page,
      renderer,
    }) => {
      await page.goto(`/${renderer}/collapsible/basic`);
      await mark(page, "collapsible-content", "viewport");
      await page.evaluate(() => {
        Document.prototype.startViewTransition = () => {
          throw new Error("broken");
        };
      });
      const trigger = page.getByTestId("collapsible-trigger");
      await trigger.click();
      await expect(page.getByTestId("collapsible-content")).toBeVisible();
      await trigger.click();
      await expect(page.getByTestId("collapsible-content")).not.toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    test("a skipped transition reports no errors", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
      test.skip(!(await supports(page, "viewport")), "no document view transition");
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await markAncestor(page, "tab-1", "mcr:tabs:", "viewport");
      await page.getByTestId("tab-2").evaluate((el) => {
        if (el instanceof HTMLElement) el.click();
        document.startViewTransition(() => {});
      });
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      await page.waitForTimeout(100);
      expect(errors).toEqual([]);
    });

    test("selects a tab through the real element transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/tabs/horizontal`);
      test.skip(!(await supports(page, "element")), "no element view transition");
      await markAncestor(page, "tab-1", "mcr:tabs:", "element");
      await page.getByTestId("tab-2").click();
      await expect(page.getByTestId("tab-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("panel-2")).not.toHaveAttribute("hidden");
    });

    test("positions a popover opened in a document transition", async ({ page, renderer }) => {
      await page.goto(`/${renderer}/popover/basic`);
      test.skip(!(await supports(page, "viewport")), "no document view transition");
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
});
