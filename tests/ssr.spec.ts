import { expect, test } from "./fixtures";

// These tests run in the Playwright worker process, not in a
// browser: importing the built bundles where `document` is undefined
// IS the assertion. The SSR guard in both entry points must make the
// import a silent no-op instead of a crash.
test.describe("SSR", () => {
  test.beforeEach(({ renderer }) => {
    test.skip(renderer !== "html", "Worker-side import; renderer-independent");
  });

  test("core imports without a DOM", async () => {
    expect(typeof document).toBe("undefined");
    await expect(import("../dist/index.js")).resolves.toBeDefined();
  });

  test("router imports without a DOM", async () => {
    expect(typeof document).toBe("undefined");
    await expect(import("../dist/router.js")).resolves.toBeDefined();
  });

  for (const name of ["accordion", "collapsible", "dialog", "menu", "popover", "tabs", "tooltip"]) {
    test(`${name} standalone imports without a DOM`, async () => {
      expect(typeof document).toBe("undefined");
      await expect(import(`../dist/${name}.js`)).resolves.toBeDefined();
    });
  }
});
