import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "./fixtures";

// Decision tests: north stars from PRINCIPLES.md, plus DOM /
// type / wrapper greps from AGENTS.md Code style, encoded as
// source greps so drift is caught before review. Paths are
// relative to the repo root (Playwright's working directory).
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

// The framework parts are templates `add` copies into projects.
const reactParts = readdirSync("templates/react")
  .filter((name) => name.endsWith(".tsx"))
  .sort()
  .map((name) => [name, readFileSync(`templates/react/${name}`, "utf8")] as const);

const vueParts = readdirSync("templates/vue", { recursive: true, encoding: "utf8" })
  .filter((path) => /\.(vue|ts)$/.test(path) && !path.startsWith("examples"))
  .sort()
  .map((path) => [path, readFileSync(`templates/vue/${path}`, "utf8")] as const);

const cores = [helper, combined, ...components.map(([, source]) => source)];
const parts = [...reactParts, ...vueParts].map(([, source]) => source);
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

  test("core and parts never write `aria-hidden`", () => {
    for (const source of [...cores, ...parts]) {
      expect(source).not.toContain("aria-hidden");
      expect(source).not.toContain("ariaHidden");
    }
  });

  test("core listens on `window` for the nine north-star events only", () => {
    const events = new Set<string>();
    for (const source of cores) {
      expect(source).not.toMatch(/\.addEventListener\(/);
      for (const [, event = ""] of source.matchAll(/addEventListener\(\s*"([a-z]+)"/g))
        events.add(event);
    }
    expect([...events].sort()).toEqual([
      "click",
      "focusin",
      "focusout",
      "keydown",
      "pointerdown",
      "pointermove",
      "pointerup",
      "resize",
      "scroll",
    ]);
  });

  test("router contains no timers", () => {
    for (const banned of timers) expect(router).not.toContain(banned);
  });

  test("router uses `querySelectorAll` exactly once, for the area lookup", () => {
    expect(router.split("querySelectorAll").length - 1).toBe(1);
  });

  test("router contains no `closest`", () => {
    expect(router).not.toContain(".closest(");
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

  test("React parts provide context without `.Provider` or `useContext`", () => {
    for (const [name, source] of reactParts) {
      expect(source, name).not.toContain(".Provider");
      expect(source, name).not.toContain("useContext");
    }
  });

  test("each Vue component's `index.ts` loads its own core", () => {
    for (const [path, source] of vueParts.filter(([path]) => path.endsWith("/index.ts"))) {
      const name = path.split("/")[0];
      expect(source, path).toContain(`import "monochrome/${name}";`);
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
