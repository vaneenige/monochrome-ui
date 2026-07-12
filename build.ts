import { execSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

// One entry per published export. `external` keeps peer frameworks out
// of the bundle; the React wrapper needs the `"use client";` banner so
// RSC treats it as a client module. Rolldown's minifier strips comments
// on its own, so there is no pre-strip pass.
const builds = [
  { input: "src/index.ts", dir: "dist", external: [] as string[] },
  { input: "src/router.ts", dir: "dist", external: [] as string[] },
  {
    input: "src/react/index.ts",
    dir: "dist/react",
    external: ["react", "react-dom"],
    banner: '"use client";',
  },
  { input: "src/vue/index.ts", dir: "dist/vue", external: ["vue"] },
];

execSync("npm run lint", { stdio: "inherit" });
rmSync("dist", { recursive: true, force: true });

// The four bundles are independent, so build them in parallel. Cuts
// pre-commit time roughly in half on a warm cache.
await Promise.all(
  builds.map(async (config) => {
    const bundle = await rolldown({
      input: config.input,
      external: config.external,
    });
    await bundle.write({
      dir: config.dir,
      format: "es",
      minify: true,
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

const coreGz = gzip("dist/index.js");
const routerGz = gzip("dist/router.js");
const reactGz = gzip("dist/react/index.js");
const vueGz = gzip("dist/vue/index.js");

// Counts actual runtime tests (so table-driven loops are counted by
// iterations, not by source occurrences). Lists every spec under the
// `html` project, which excludes only the router skips in react/vue.
// This is the number of UNIQUE tests; the react and vue projects run
// (almost) the same suite again, so CI executes roughly three times
// this figure. Marketing copy quotes the unique count on purpose.
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
  routerGzipSize: routerGz,
  wrappersGzipSize: { react: reactGz, vue: vueGz },
  tests: { total: totalTests, ...testCounts },
};
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

console.log(
  `Build complete. Core: ${fmt(coreGz)} gzipped, router: ${fmt(routerGz)} gzipped, ${totalTests} tests.`,
);
