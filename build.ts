import { execSync } from "node:child_process";
import { chmodSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";
import { buildFiles } from "./scripts/files.js";
import { support } from "./scripts/support.js";

// Reach past package.json `browserslist` fails the build.
support();

const cores = ["accordion", "collapsible", "dialog", "menu", "popover", "tabs", "tooltip"] as const;
// Every component, from the one list (templates/manifest.json).
const components: string[] = Object.keys(
  JSON.parse(readFileSync("templates/manifest.json", "utf8")).components,
);

// The granular entries build as one code-split graph: their shared
// helpers land in one chunk, `dom.js`, so importing two components
// never duplicates it or registers a listener twice. `dom.js` is
// internal, so its export names are minified.
//
// `index.js` is the one deliberate flat build: the full core in a
// single self-contained file backing the bare `monochrome` import.
// It duplicates the module files, so a page must load either it or
// the granular entries, never both, or listeners register twice.
const builds = [
  {
    input: [...cores.map((name) => `src/${name}.ts`), "src/router.ts"],
    dir: "dist",
    entryFileNames: "[name].js",
    chunkFileNames: "[name].js",
  },
  {
    input: "src/index.ts",
    dir: "dist",
    entryFileNames: "index.js",
  },
];

// The CLI: a separate Node bundle, dist/cli.js, outside the size
// report.
const buildCli = async () => {
  const bundle = await rolldown({ input: "cli/index.ts", platform: "node" });
  await bundle.write({
    file: "dist/cli.js",
    format: "es",
    banner: "#!/usr/bin/env node",
    minify: true,
  });
  await bundle.close();
  chmodSync("dist/cli.js", 0o755);
};

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

rmSync("dist", { recursive: true, force: true });
// `dist/files/` is what `npx monochrome add` copies (see
// scripts/files.ts).
await buildFiles(version);

await Promise.all([
  buildCli(),
  ...builds.map(async (config) => {
    const bundle = await rolldown({ input: config.input });
    await bundle.write({
      dir: config.dir,
      format: "es",
      // Full Oxc minify (compress + mangle). Rolldown's default is
      // `'dce-only'`.
      minify: { compress: true, mangle: true },
      // No annotation comments: the files ship minified.
      comments: false,
      entryFileNames: config.entryFileNames,
      ...(config.chunkFileNames ? { chunkFileNames: config.chunkFileNames } : {}),
    });
    await bundle.close();
  }),
]);

try {
  execSync("bunx tsc -p tsconfig.build.json", { stdio: "pipe" });
} catch (error) {
  const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
  console.error((stdout?.toString() ?? "") + (stderr?.toString() ?? ""));
  process.exit(1);
}
// `dom.js` exports minified names, so its declarations would describe
// exports that do not exist. Nothing public imports it.
rmSync("dist/dom.d.ts");

const gzip = (path: string) => gzipSync(readFileSync(path)).length;
const gzipAll = (paths: string[]) =>
  gzipSync(Buffer.concat(paths.map((path) => readFileSync(path)))).length;
const fmt = (bytes: number) => `${(bytes / 1024).toFixed(1)}kB`;

// One entry per export, each `{ core }`: the gzip bytes that entry
// pulls in, including the shared `dom.js`; `menubar` pulls in
// `menu`. `index.core` (and the headline `gzipSize`) is the flat
// `index.js` the bare import ships: what a bundler emits after
// scope-hoisting the granular modules.
const coreGz = gzip("dist/index.js");
const componentSizes = (name: string) => ({
  core: gzipAll(["dist/dom.js", `dist/${name === "menubar" ? "menu" : name}.js`]),
});
const sizeEntries: [string, Record<string, number>][] = [
  ["index", { core: coreGz }],
  ["router", { core: gzip("dist/router.js") }],
  ...components.map((name): [string, Record<string, number>] => [name, componentSizes(name)]),
];
const gzipSizes = Object.fromEntries(sizeEntries.sort(([a], [b]) => a.localeCompare(b)));

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

pkg.versionMeta = {
  gzipSize: coreGz,
  gzipSizes,
};
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

const listed = cores.map((name) => `${name} ${fmt(gzipSizes[name]?.core ?? 0)}`).join(", ");
console.log(
  `Build complete. Core: ${fmt(coreGz)} gzipped, router: ${fmt(gzipSizes.router?.core ?? 0)} gzipped, standalone: ${listed}.`,
);
