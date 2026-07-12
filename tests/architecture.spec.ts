import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";

// Decision tests: the non-negotiables from AGENTS.md, encoded as
// source greps so drift is caught before review. Paths are relative
// to the repo root (Playwright's working directory).
const core = readFileSync("src/index.ts", "utf8");
const router = readFileSync("src/router.ts", "utf8");

const timers = ["setTimeout(", "setInterval(", "requestAnimationFrame(", "queueMicrotask("];

test.describe("Architecture invariants", () => {
  test.beforeEach(({ renderer }) => {
    test.skip(renderer !== "html", "Source greps; renderer-independent");
  });

  test("core contains no timers", () => {
    for (const banned of timers) expect(core).not.toContain(banned);
  });

  test("core contains no `querySelector` or `closest`", () => {
    expect(core).not.toContain("querySelector");
    expect(core).not.toContain(".closest(");
  });

  test("router contains no timers", () => {
    for (const banned of timers) expect(router).not.toContain(banned);
  });

  test("router uses `querySelectorAll` exactly once, for the area lookup", () => {
    expect(router.split("querySelectorAll").length - 1).toBe(1);
  });

  test("core and router contain no `as` casts or non-null assertions", () => {
    for (const source of [core, router]) {
      // Prose mentions "as" too; only code lines count.
      const code = source
        .split("\n")
        .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
        .join("\n");
      expect(code).not.toMatch(/ as [A-Z]/);
      expect(code).not.toMatch(/[)\w\]]!\./);
    }
  });
});
