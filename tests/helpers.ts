import type { Page } from "@playwright/test";

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
