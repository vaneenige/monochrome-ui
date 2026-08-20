import { execSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
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

// One entry per published export. Combined `index` stays the default
// (`import "monochrome"`). Each component also ships its own file;
// rolldown inlines `dom.ts` into that bundle. `package.json`
// `sideEffects` lists the source component files so the combined
// entry's side-effect imports are not tree-shaken. `external` keeps
// peer frameworks out of wrapper bundles; the React wrappers need
// the `"use client";` banner so RSC treats them as client modules.
const builds = [
  { input: "src/index.ts", dir: "dist", external: [] as string[] },
  { input: "src/router.ts", dir: "dist", external: [] as string[] },
  ...cores.map((name) => ({
    input: `src/${name}.ts`,
    dir: "dist",
    external: [] as string[],
  })),
  {
    input: "src/react/index.ts",
    dir: "dist/react",
    external: ["react", "react-dom"],
    banner: '"use client";',
  },
  ...wrappers.map((name) => ({
    input: `src/react/${name}.ts`,
    dir: "dist/react",
    external: ["react", "react-dom"],
    banner: '"use client";',
  })),
  { input: "src/vue/index.ts", dir: "dist/vue", external: ["vue"] },
  ...wrappers.map((name) => ({
    input: `src/vue/${name}.ts`,
    dir: "dist/vue",
    external: ["vue"],
  })),
];

execSync("npm run lint", { stdio: "inherit" });
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
    });
    await bundle.close();
  }),
);

try {
  execSync("npx tsc -p tsconfig.build.json", { stdio: "pipe" });
} catch (error) {
  const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
  console.error((stdout?.toString() ?? "") + (stderr?.toString() ?? ""));
  process.exit(1);
}

const gzip = (path: string) => gzipSync(readFileSync(path)).length;
const fmt = (bytes: number) => `${(bytes / 1024).toFixed(1)}kB`;

// One entry per export, each an object with a gzip number per
// published flavour. `menubar` shares the menu core file; `router`
// has no wrappers; `index` is the three combined entries.
const coreGz = gzip("dist/index.js");
const componentSizes = (name: (typeof wrappers)[number]) => ({
  core: gzip(`dist/${name === "menubar" ? "menu" : name}.js`),
  react: gzip(`dist/react/${name}.js`),
  vue: gzip(`dist/vue/${name}.js`),
});
const gzipSizes: Record<string, Record<string, number>> = Object.fromEntries(
  (
    [
      [
        "index",
        { core: coreGz, react: gzip("dist/react/index.js"), vue: gzip("dist/vue/index.js") },
      ],
      ["router", { core: gzip("dist/router.js") }],
      ...wrappers.map((name) => [name, componentSizes(name)] as const),
    ] as [string, Record<string, number>][]
  ).sort(([a], [b]) => a.localeCompare(b)),
);

const listing = execSync("npx playwright test --list --project=html --reporter=line", {
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
