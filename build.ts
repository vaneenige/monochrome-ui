import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

const cores = ["accordion", "collapsible", "dialog", "menu", "popover", "tabs", "tooltip"] as const;
const wrappers = [
  "accordion",
  "collapsible",
  "dialog",
  "menu",
  "menubar",
  "popover",
  "tabs",
  "tooltip",
] as const;

// The granular entries build with `preserveModules`: one output
// module per source file, so every one of them (a core subpath, a
// wrapper index) resolves to the same module instances. That
// identity is what lets wrappers side-effect-import their own core
// file (`../menu.js` stays external and resolves to `dist/menu.js`)
// without ever double-registering listeners next to a sibling core
// import like `monochrome/tooltip`. `package.json` `sideEffects`
// lists the core files so bundlers keep them, while wrapper modules
// stay side-effect-free and prunable: importing one component from
// a wrapper index ships exactly that wrapper plus its core.
// `external` keeps peer frameworks out of wrapper bundles; the
// React wrappers need the `"use client";` banner so RSC treats them
// as client modules.
//
// `index.js` is the one deliberate flat build: the full core in a
// single self-contained file backing the bare `monochrome` import.
// It duplicates the module files, so a page must load either it or
// the granular entries (component cores, wrappers) — never both,
// or listeners register twice.
const builds = [
  {
    input: [...cores.map((name) => `src/${name}.ts`), "src/router.ts"],
    dir: "dist",
    external: [] as (string | RegExp)[],
    preserveRoot: "src",
  },
  {
    input: "src/index.ts",
    dir: "dist",
    external: [] as (string | RegExp)[],
    entryFileNames: "index.js",
  },
  {
    input: "src/react/index.ts",
    dir: "dist/react",
    external: ["react", "react-dom", /^\.\.\//],
    banner: '"use client";',
    preserveRoot: "src/react",
  },
  {
    input: "src/remix/index.ts",
    dir: "dist/remix",
    external: ["remix", "remix/ui", /^remix\//, /^\.\.\//],
    preserveRoot: "src/remix",
  },
  {
    input: "src/vue/index.ts",
    dir: "dist/vue",
    external: ["vue", /^\.\.\//],
    preserveRoot: "src/vue",
  },
];

execSync("bun run lint", { stdio: "inherit" });
rmSync("dist", { recursive: true, force: true });

await Promise.all(
  builds.map(async (config) => {
    const bundle = await rolldown({
      input: config.input,
      external: config.external,
    });
    await bundle.write({
      dir: config.dir,
      format: "es",
      // Full Oxc minify (compress + mangle). Rolldown's default is
      // `'dce-only'`.
      minify: { compress: true, mangle: true },
      ...(config.banner ? { banner: config.banner } : {}),
      ...(config.preserveRoot
        ? { preserveModules: true, preserveModulesRoot: config.preserveRoot }
        : {}),
      ...(config.entryFileNames ? { entryFileNames: config.entryFileNames } : {}),
    });
    await bundle.close();
  }),
);

try {
  execSync("bunx tsc -p tsconfig.build.json", { stdio: "pipe" });
} catch (error) {
  const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
  console.error((stdout?.toString() ?? "") + (stderr?.toString() ?? ""));
  process.exit(1);
}

const gzip = (path: string) => gzipSync(readFileSync(path)).length;
const gzipAll = (paths: string[]) =>
  gzipSync(Buffer.concat(paths.map((path) => readFileSync(path)))).length;
const fmt = (bytes: number) => `${(bytes / 1024).toFixed(1)}kB`;

// One entry per export, each an object with a gzip number per
// published flavour: the bytes that entry pulls in from its own
// flavour. Core numbers include the shared `dom.js`; remix and vue
// numbers include the runtime `shared.js`; `menubar` pulls in `menu`.
// Wrapper numbers exclude the core each wrapper auto-imports —
// that lives under `core`. The wrapper `index` numbers are every
// module of that framework gzipped together. `index.core` (and the
// headline `gzipSize`) is the flat `index.js` the bare import
// ships — what a bundler emits after scope-hoisting the granular
// modules, and comparable to pre-module-split releases.
const gzipDir = (dir: string) =>
  gzipAll(
    readdirSync(dir)
      .filter((file) => file.endsWith(".js"))
      .sort()
      .map((file) => `${dir}/${file}`),
  );
const coreGz = gzip("dist/index.js");
const componentSizes = (name: (typeof wrappers)[number]) => ({
  core: gzipAll(["dist/dom.js", `dist/${name === "menubar" ? "menu" : name}.js`]),
  react: gzipAll([`dist/react/${name}.js`, ...(name === "menubar" ? ["dist/react/menu.js"] : [])]),
  remix: gzipAll([
    `dist/remix/${name}.js`,
    "dist/remix/shared.js",
    ...(name === "menubar" ? ["dist/remix/menu.js"] : []),
  ]),
  vue: gzipAll([
    `dist/vue/${name}.js`,
    "dist/vue/shared.js",
    ...(name === "menubar" ? ["dist/vue/menu.js"] : []),
  ]),
});
const gzipSizes: Record<string, Record<string, number>> = Object.fromEntries(
  (
    [
      [
        "index",
        {
          core: coreGz,
          react: gzipDir("dist/react"),
          remix: gzipDir("dist/remix"),
          vue: gzipDir("dist/vue"),
        },
      ],
      ["router", { core: gzip("dist/router.js") }],
      ...wrappers.map((name) => [name, componentSizes(name)] as const),
    ] as [string, Record<string, number>][]
  ).sort(([a], [b]) => a.localeCompare(b)),
);

const listing = execSync("bun --bun playwright test --list --project=html --reporter=line", {
  encoding: "utf8",
});
const testCounts: Record<string, number> = {};
for (const line of listing.split("\n")) {
  const name = line.match(/\[html\] › (\w+)\.spec\.ts:/)?.[1];
  if (name) testCounts[name] = (testCounts[name] ?? 0) + 1;
}
const totalTests = Object.values(testCounts).reduce((a, b) => a + b, 0);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
pkg.versionMeta = {
  gzipSize: coreGz,
  gzipSizes,
  tests: { total: totalTests, ...testCounts },
};
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

const listed = cores.map((name) => `${name} ${fmt(gzipSizes[name]?.core ?? 0)}`).join(", ");
console.log(
  `Build complete. Core: ${fmt(coreGz)} gzipped, router: ${fmt(gzipSizes.router?.core ?? 0)} gzipped, standalone: ${listed}, ${totalTests} tests.`,
);
