import { join } from "node:path"
import { renderToString } from "react-dom/server"

const distDir = join(import.meta.dir, "..", "dist")
const fixturesDir = join(import.meta.dir, "fixtures")

const cache = new Map<string, Response>()

Bun.serve({
  port: 4000,
  async fetch(req) {
    const pathname = new URL(req.url).pathname

    const cached = cache.get(pathname)
    if (cached) return cached.clone()

    let response: Response | null = null

    if (pathname === "/index.js") {
      const file = Bun.file(join(distDir, "index.js"))
      if (await file.exists()) {
        response = new Response(await file.arrayBuffer(), {
          headers: { "Content-Type": "application/javascript" },
        })
      } else {
        return new Response("Not found", { status: 404 })
      }
    }

    if (pathname === "/test.css") {
      const file = Bun.file(join(fixturesDir, "test.css"))
      response = new Response(await file.arrayBuffer(), {
        headers: { "Content-Type": "text/css" },
      })
    }

    if (pathname.startsWith("/test/")) {
      const name = pathname.slice(6)
      const filePath = join(fixturesDir, `${name}.tsx`)

      if (!(await Bun.file(filePath).exists())) {
        return new Response("Not found", { status: 404 })
      }

      const module = await import(filePath)
      const Component = module.default
      const html = renderToString(Component({}))

      response = new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="stylesheet" href="/test.css">
  <script src="/index.js"></script>
</head>
<body>
  ${html}
</body>
</html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    if (response) {
      cache.set(pathname, response.clone())
      return response
    }

    return new Response("Not found", { status: 404 })
  },
})

console.log("Test server running on http://localhost:4000")
