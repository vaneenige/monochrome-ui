import { compileScript, parse } from "@vue/compiler-sfc"
import type { BunPlugin } from "bun"
import { renderToString } from "react-dom/server"
import { createSSRApp } from "vue"
import { renderToString as vueRenderToString } from "vue/server-renderer"

const vueSfcPlugin: BunPlugin = {
  name: "vue-sfc",
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async (args) => {
      const source = await Bun.file(args.path).text()
      const { descriptor } = parse(source, { filename: args.path })
      const scriptResult = compileScript(descriptor, {
        id: args.path.replace(/[/\\]/g, "_"),
        inlineTemplate: true,
        templateOptions: { compilerOptions: { mode: "module" } },
      })
      return { contents: scriptResult.content, loader: "ts" }
    })
  },
}

const distDir = new URL("../dist", import.meta.url).pathname
const fixturesDir = new URL("fixtures", import.meta.url).pathname
const cache = new Map<string, Response>()

Bun.plugin(vueSfcPlugin)

const page = (title: string, body: string) =>
  new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/test.css">
  <script src="/index.js"></script>
</head>
<body>
  ${body}
  <script>
    document.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]')
      if (item) document.getElementById('output').textContent = item.dataset.action
    })
  </script>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  )

async function findFixture(name: string): Promise<string | null> {
  const exts = name.startsWith("vue/") ? [".vue", ".ts"] : [".tsx"]
  for (const ext of exts) {
    const path = `${fixturesDir}/${name}${ext}`
    if (await Bun.file(path).exists()) return path
  }
  return null
}

async function ssr(name: string, filePath: string): Promise<string> {
  const mod = await import(filePath)
  if (name.startsWith("vue/")) return vueRenderToString(createSSRApp(mod.default))
  return renderToString(mod.default({}))
}

Bun.serve({
  port: 4000,
  async fetch(req) {
    const pathname = new URL(req.url).pathname

    const cached = cache.get(pathname)
    if (cached) return cached.clone()

    let response: Response | null = null

    if (pathname === "/index.js") {
      const file = Bun.file(`${distDir}/index.js`)
      if (await file.exists()) {
        response = new Response(await file.arrayBuffer(), {
          headers: { "Content-Type": "application/javascript" },
        })
      }
    } else if (pathname === "/test.css") {
      response = new Response(await Bun.file(`${fixturesDir}/test.css`).arrayBuffer(), {
        headers: { "Content-Type": "text/css" },
      })
    } else if (pathname.startsWith("/bundle/")) {
      const name = pathname.slice(8).replace(/\.js$/, "")
      const filePath = await findFixture(name)
      if (filePath) {
        const result = await Bun.build({
          entrypoints: [filePath],
          format: "esm",
          plugins: name.startsWith("vue/") ? [vueSfcPlugin] : [],
        })
        response = new Response(await result.outputs[0].text(), {
          headers: { "Content-Type": "application/javascript" },
        })
      }
    } else {
      const name = pathname.slice(1)
      if (name.startsWith("html/")) {
        const file = Bun.file(`${fixturesDir}/${name}.html`)
        if (await file.exists()) response = page(name, await file.text())
      } else {
        const filePath = await findFixture(name)
        if (filePath) {
          // .vue SFCs always SSR (script setup has implicit export default)
          // .ts/.tsx check source for export default to distinguish static from dynamic
          const isStatic =
            filePath.endsWith(".vue") || /^export default/m.test(await Bun.file(filePath).text())
          if (isStatic) {
            response = page(name, await ssr(name, filePath))
          } else {
            response = page(
              name,
              `<div id="root"></div>\n  <script type="module" src="/bundle/${name}.js"></script>`,
            )
          }
        }
      }
    }

    if (response) {
      cache.set(pathname, response.clone())
      return response
    }
    return new Response("Not found", { status: 404 })
  },
})

console.log("Test server running on http://localhost:4000")
