import { $, type BuildConfig, type BunPlugin } from "bun";
import ts from "typescript";

// Bun's minifier re-shuffles identifiers based on comment placement,
// which produces different (worse-compressing) output, ~135 bytes
// gzip total in our case. We pre-strip comments so the minifier
// never sees them.
//
// We use TypeScript's own parser + printer because it handles every
// edge case the language allows (nested templates, regex, JSX, …)
// that a regex stripper would get wrong.
const stripComments = (src: string) =>
	ts
		.createPrinter({ removeComments: true })
		.printFile(ts.createSourceFile("_.ts", src, ts.ScriptTarget.ESNext, false));

const stripCommentsPlugin: BunPlugin = {
	name: "strip-comments",
	setup(build) {
		build.onLoad({ filter: /\.ts$/ }, async (args) => {
			if (args.path.includes("/node_modules/")) return;
			const source = await Bun.file(args.path).text();
			return { contents: stripComments(source), loader: "ts" };
		});
	},
};

// `Partial<BuildConfig>` because each entry only sets the fields that
// differ from the shared defaults merged at build time. The resulting
// spread always includes `entrypoints`, which the cast at the call
// site re-asserts; TS can't narrow that through a spread.
const builds: Partial<BuildConfig>[] = [
	{ entrypoints: ["src/index.ts"], outdir: "dist" },
	{ entrypoints: ["src/router.ts"], outdir: "dist" },
	{
		entrypoints: ["src/react/index.ts"],
		outdir: "dist/react",
		external: ["react", "react-dom"],
		banner: '"use client";',
	},
	{ entrypoints: ["src/vue/index.ts"], outdir: "dist/vue", external: ["vue"] },
];

await $`bun run lint`;
await $`rm -rf dist`;

// The four bundles are independent, so build them in parallel. Cuts
// pre-commit time roughly in half on a warm cache.
const results = await Promise.all(
	builds.map((config) =>
		Bun.build({
			format: "esm",
			minify: true,
			plugins: [stripCommentsPlugin],
			...config,
		} as BuildConfig),
	),
);
for (const result of results) {
	if (!result.success) {
		for (const log of result.logs) console.error(log);
		process.exit(1);
	}
}

const dts = await $`tsc -p tsconfig.build.json`.quiet();
if (dts.exitCode !== 0) {
	console.error(dts.stderr.toString());
	process.exit(1);
}

const gzip = async (path: string) =>
	Bun.gzipSync(new Uint8Array(await Bun.file(path).arrayBuffer())).length;
const fmt = (bytes: number) => `${(bytes / 1024).toFixed(1)}kB`;

const coreGz = await gzip("dist/index.js");
const routerGz = await gzip("dist/router.js");
const reactGz = await gzip("dist/react/index.js");
const vueGz = await gzip("dist/vue/index.js");

const testCounts: Record<string, number> = {};
for await (const path of new Bun.Glob("tests/*.spec.ts").scan()) {
	const name = path.replace("tests/", "").replace(".spec.ts", "");
	testCounts[name] = (
		(await Bun.file(path).text()).match(/test\(/g) ?? []
	).length;
}
const totalTests = Object.values(testCounts).reduce((a, b) => a + b, 0);

const pkg = await Bun.file("package.json").json();
pkg.versionMeta = {
	gzipSize: coreGz,
	routerGzipSize: routerGz,
	wrappersGzipSize: { react: reactGz, vue: vueGz },
	tests: { total: totalTests, ...testCounts },
};
await Bun.write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

console.log(
	`Build complete. Core: ${fmt(coreGz)} gzipped, router: ${fmt(routerGz)} gzipped, ${totalTests} tests.`,
);
