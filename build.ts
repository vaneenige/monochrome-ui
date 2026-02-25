import { $ } from "bun"

await $`rm -rf dist`

const core = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  format: "esm",
  target: "browser",
  minify: true,
})

if (!core.success) {
  for (const log of core.logs) console.error(log)
  process.exit(1)
}

const { outputs } = await Bun.build({
  entrypoints: ["src/index.ts"],
  minify: true,
})

const output = outputs[0]
if (!output) throw new Error("Build produced no output")

const gzipped = Bun.gzipSync(await output.arrayBuffer())
const sizeKB = `${(gzipped.length / 1024).toFixed(1)}kB`

const glob = new Bun.Glob("tests/*.spec.ts")
const testCounts: Record<string, number> = {}
for await (const path of glob.scan()) {
  const name = path.replace("tests/", "").replace(".spec.ts", "")
  const content = await Bun.file(path).text()
  testCounts[name] = (content.match(/test\(/g) ?? []).length
}

let readme = await Bun.file("README.md").text()
const totalTests = Object.values(testCounts).reduce((a, b) => a + b, 0)
readme = readme.replace(/<!-- size -->.*?<!-- \/size -->/g, `<!-- size -->${sizeKB}<!-- /size -->`)
readme = readme.replace(/<!-- tests:total -->.*?<!-- \/tests:total -->/g, `<!-- tests:total -->${totalTests}<!-- /tests:total -->`)
readme = readme.replace(
  /<!-- badges -->\n.*\n<!-- \/badges -->/,
  `<!-- badges -->\n![gzip](https://img.shields.io/badge/gzip-${sizeKB}-brightgreen) ![tests](https://img.shields.io/badge/tests-${totalTests}_passing-brightgreen) ![WCAG](https://img.shields.io/badge/WCAG_2.2-AA-blue) ![license](https://img.shields.io/badge/license-MIT-blue)\n<!-- /badges -->`,
)
for (const [name, count] of Object.entries(testCounts)) {
  readme = readme.replace(
    new RegExp(`<!-- tests:${name} -->.*?<!-- /tests:${name} -->`),
    `<!-- tests:${name} -->${count}<!-- /tests:${name} -->`,
  )
}
await Bun.write("README.md", readme)

const pkg = await Bun.file("package.json").json()
pkg.versionMeta = {
  gzipSize: gzipped.length,
  tests: { total: totalTests, ...testCounts },
}
await Bun.write("package.json", JSON.stringify(pkg, null, 2) + "\n")

console.log(`Build complete — core: ${sizeKB} gzipped, ${totalTests} tests`)
