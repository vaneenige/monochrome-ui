import { readFileSync } from "node:fs";
import type { Locator, Page } from "@playwright/test";

/**
 * Programmatically scroll the page and wait for the resulting scroll
 * event to dispatch before returning.
 *
 * Why this exists: `window.scrollTo` schedules its scroll event
 * asynchronously. If a test opens a menu / popover / tooltip right
 * after scrolling, the deferred scroll event can fire after the open
 * and our core (correctly) closes it on scroll, failing the test.
 * Real users don't programmatically scroll; only tests do, so the
 * fix belongs here.
 *
 * No-ops (already at target) resolve immediately. Both axes supported.
 */
export const scrollAndSettle = (page: Page, x: number, y: number) =>
  page.evaluate(
    ({ x, y }) =>
      new Promise<void>((resolve) => {
        if (window.scrollX === x && window.scrollY === y) return resolve();
        window.addEventListener("scroll", () => resolve(), { once: true });
        window.scrollTo(x, y);
      }),
    { x, y },
  );

/**
 * Flip the document to right-to-left. The core reads `document.dir`
 * on every event (DOM as state), so no reload is needed.
 */
export const setRtl = (page: Page) =>
  page.evaluate(() => {
    document.dir = "rtl";
  });

/** Swaps the fixture stylesheet for each named spec's Styling CSS
 *  (Required and Example), as a project that follows it renders. */
export const loadSpecCss = (page: Page, ...names: string[]) => {
  const styling = (name: string) => {
    const text = readFileSync(new URL(`../spec/${name}.md`, import.meta.url), "utf8");
    const at = text.indexOf("\n## Styling\n");
    const section = text.slice(at, text.indexOf("\n## ", at + 1));
    return Array.from(section.matchAll(/```css\n([\s\S]*?)```/g), ([, css]) => css).join("\n");
  };
  const css = names.map(styling).join("\n");
  return page.evaluate((text) => {
    document.querySelector('link[href="/test.css"]')?.remove();
    const style = document.createElement("style");
    style.textContent = text;
    document.head.append(style);
  }, css);
};

export const pointerDown = (locator: Locator, init: PointerEventInit = {}) =>
  locator.dispatchEvent("pointerdown", init);
export const pointerUp = (locator: Locator, init: PointerEventInit = {}) =>
  locator.dispatchEvent("pointerup", init);
