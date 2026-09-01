import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "./fixtures";

// Decision tests: the non-negotiables from AGENTS.md, encoded as
// source greps so drift is caught before review. Paths are relative
// to the repo root (Playwright's working directory).
const helper = readFileSync("src/dom.ts", "utf8");
const combined = readFileSync("src/index.ts", "utf8");
const router = readFileSync("src/router.ts", "utf8");
const components = readdirSync("src")
  .filter(
    (name) =>
      name.endsWith(".ts") && name !== "index.ts" && name !== "router.ts" && name !== "dom.ts",
  )
  .sort()
  .map((name) => [name, readFileSync(`src/${name}`, "utf8")] as const);

const reactWrappers = readdirSync("src/react")
  .filter((name) => name.endsWith(".ts"))
  .sort()
  .map((name) => [name, readFileSync(`src/react/${name}`, "utf8")] as const);

const remixWrappers = readdirSync("src/remix")
  .filter((name) => name.endsWith(".ts"))
  .sort()
  .map((name) => [name, readFileSync(`src/remix/${name}`, "utf8")] as const);

const cores = [helper, combined, ...components.map(([, source]) => source)];
const timers = ["setTimeout(", "setInterval(", "requestAnimationFrame(", "queueMicrotask("];

const importsFrom = (source: string) =>
  [...source.matchAll(/^import[\s\S]*?from\s+"([^"]+)"/gm)].map((match) => match[1]);

test.describe("Architecture invariants", () => {
  test.beforeEach(({ renderer }) => {
    test.skip(renderer !== "html", "Source greps; renderer-independent");
  });

  test("core contains no timers", () => {
    for (const source of cores) {
      for (const banned of timers) expect(source).not.toContain(banned);
    }
  });

  test("core contains no `querySelector` or `closest`", () => {
    for (const source of cores) {
      expect(source).not.toContain("querySelector");
      expect(source).not.toContain(".closest(");
    }
  });

  test("router contains no timers", () => {
    for (const banned of timers) expect(router).not.toContain(banned);
  });

  test("router uses `querySelectorAll` exactly once, for the area lookup", () => {
    expect(router.split("querySelectorAll").length - 1).toBe(1);
  });

  test("router writes the fetch cache only through the bounded `store`", () => {
    expect(router.split("cache.set(").length - 1).toBe(1);
  });

  test("core and router contain no `as` casts or non-null assertions", () => {
    for (const source of [...cores, router]) {
      // Prose mentions "as" too; only code lines count.
      const code = source
        .split("\n")
        .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
        .join("\n");
      expect(code).not.toMatch(/ as [A-Z]/);
      expect(code).not.toMatch(/[)\w\]]!\./);
    }
  });

  test("helpers import nothing", () => {
    expect(helper).not.toMatch(/^import /m);
  });

  test("components import only shared helpers", () => {
    for (const [name, source] of components) {
      expect(importsFrom(source), name).toEqual(["./dom.js"]);
    }
  });

  test("React wrappers provide context without `.Provider` or `useContext`", () => {
    for (const [name, source] of reactWrappers) {
      expect(source, name).not.toContain(".Provider");
      expect(source, name).not.toContain("useContext");
    }
  });

  test("Remix wrappers use Handle factories and `createElement`", () => {
    for (const [name, source] of remixWrappers) {
      expect(source, name).not.toContain("jsx");
      if (name !== "index.ts" && name !== "shared.ts") {
        expect(source, name).toContain("createElement");
        expect(source, name).toContain("handle: Handle");
      }
    }
  });

  test("combined entry imports every component and nothing else", () => {
    expect(importsFrom(combined)).toEqual([]);
    expect([...combined.matchAll(/^import "([^"]+)"/gm)].map((match) => match[1])).toEqual([
      "./accordion.js",
      "./collapsible.js",
      "./dialog.js",
      "./menu.js",
      "./popover.js",
      "./tabs.js",
      "./tooltip.js",
    ]);
  });
});
