import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { compileScript, parse } from "@vue/compiler-sfc";
import { renderToString } from "react-dom/server";
import { rolldown, type Plugin } from "rolldown";
import { createSSRApp } from "vue";
import { renderToString as vueRenderToString } from "vue/server-renderer";

const distDir = fileURLToPath(new URL("../dist", import.meta.url));
const fixturesDir = fileURLToPath(new URL("fixtures", import.meta.url));
// Transient SSR bundles live outside dist/ so they are never published
// (`files: ["dist"]`); kept inside the package so `monochrome/*`
// self-references still resolve from the imported temp module.
const ssrDir = fileURLToPath(new URL("../.ssr", import.meta.url));
mkdirSync(ssrDir, { recursive: true });

// Compile `.vue` SFCs on load; hand the compiled `<script>` back to
// rolldown as TypeScript so oxc finishes the transform. `.ts`/`.tsx`
// (incl. JSX) rolldown handles natively.
const vuePlugin: Plugin = {
  name: "vue-sfc",
  load(id) {
    if (!id.endsWith(".vue")) return null;
    const { descriptor } = parse(readFileSync(id, "utf8"), { filename: id });
    const compiled = compileScript(descriptor, {
      id: id.replace(/[/\\]/g, "_"),
      inlineTemplate: true,
      templateOptions: { compilerOptions: { mode: "module" } },
    });
    return { code: compiled.content, moduleType: "ts" };
  },
};

// Fixtures import the library by its published name; map that to the
// freshly built `dist/`.
const alias = {
  "monochrome/react": `${distDir}/react/index.js`,
  "monochrome/vue": `${distDir}/vue/index.js`,
  monochrome: `${distDir}/index.js`,
};

// Client bundles are self-contained (the browser has no resolver);
// SSR bundles keep the frameworks and the library external so Node
// resolves them at import time.
const ssrExternal = [
  "react",
  "react-dom",
  "react-dom/server",
  "react/jsx-runtime",
  "vue",
  "vue/server-renderer",
  "monochrome",
  "monochrome/react",
  "monochrome/vue",
];

// The wrappers side-effect-import their core as `../{name}.js`.
// Client bundles keep those external, rewritten to the absolute
// `/{name}.js` URLs the page-level `/index.js` shim also imports,
// so the browser loads one module instance per core file — exactly
// like a bundler deduping the published package.
const coreExternal: Plugin = {
  name: "core-external",
  resolveId: (id) =>
    /^\.\.\/[a-z]+\.js$/.test(id) ? { id: `/${id.slice(3)}`, external: "absolute" as const } : null,
};

const clientCache = new Map<string, string>();
const ssrPathCache = new Map<string, string>();

const bundleForClient = async (filePath: string): Promise<string> => {
  const cached = clientCache.get(filePath);
  if (cached) return cached;
  const bundle = await rolldown({
    input: filePath,
    plugins: [vuePlugin, coreExternal],
    resolve: { alias },
  });
  const { output } = await bundle.generate({ format: "es" });
  await bundle.close();
  const code = output[0]!.code;
  clientCache.set(filePath, code);
  return code;
};

const bundleForSSR = async (name: string, filePath: string): Promise<string> => {
  const cached = ssrPathCache.get(name);
  if (cached) return cached;
  const entryFileNames = `${name.replace(/[/\\]/g, "_")}.mjs`;
  const bundle = await rolldown({
    input: filePath,
    plugins: [vuePlugin],
    external: ssrExternal,
  });
  await bundle.write({ dir: ssrDir, entryFileNames, format: "es" });
  await bundle.close();
  const path = `${ssrDir}/${entryFileNames}`;
  ssrPathCache.set(name, path);
  return path;
};

const page = (title: string, body: string): string =>
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/test.css">
  <script type="module" src="/index.js"></script>
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
</html>`;

const findFixture = (name: string): string | null => {
  const exts = name.startsWith("vue/") ? [".vue", ".ts"] : [".tsx"];
  for (const ext of exts) {
    const path = `${fixturesDir}/${name}${ext}`;
    if (existsSync(path)) return path;
  }
  return null;
};

const ssr = async (name: string, filePath: string): Promise<string> => {
  const mod = await import(await bundleForSSR(name, filePath));
  if (name.startsWith("vue/")) return vueRenderToString(createSSRApp(mod.default));
  return renderToString(mod.default({}));
};

type Reply = { status: number; type?: string; body: string; location?: string };
const cache = new Map<string, Reply>();

const resolve = async (pathname: string): Promise<Reply | null> => {
  // `dist/index.js` is the flat standalone build; serving it next to
  // the granular files the fixture bundles import would register
  // every listener twice. Pages get a shim over the granular modules
  // instead — the same graph a bundler resolves for the package.
  if (pathname === "/index.js") {
    const shim = ["accordion", "collapsible", "dialog", "menu", "popover", "tabs", "tooltip"]
      .map((name) => `import "/${name}.js";`)
      .join("\n");
    return { status: 200, type: "application/javascript", body: shim };
  }
  if (/^\/[a-z]+\.js$/.test(pathname)) {
    const path = `${distDir}${pathname}`;
    if (existsSync(path)) {
      return { status: 200, type: "application/javascript", body: readFileSync(path, "utf8") };
    }
    return null;
  }
  if (pathname === "/test.css") {
    return { status: 200, type: "text/css", body: readFileSync(`${fixturesDir}/test.css`, "utf8") };
  }
  if (pathname.startsWith("/bundle/")) {
    const name = pathname.slice(8).replace(/\.js$/, "");
    const filePath = findFixture(name);
    if (filePath) {
      return { status: 200, type: "application/javascript", body: await bundleForClient(filePath) };
    }
    return null;
  }
  if (pathname === "/html/router/redirect") {
    return { status: 302, body: "", location: "/html/router/about" };
  }
  if (pathname === "/html/router/redirect-loop") {
    return { status: 302, body: "", location: "https://example.com/external" };
  }

  const name = pathname.slice(1);
  if (name.startsWith("html/router/")) {
    const path = `${fixturesDir}/${name}.html`;
    if (existsSync(path)) {
      return { status: 200, type: "text/html", body: readFileSync(path, "utf8") };
    }
    return null;
  }
  if (name.startsWith("html/")) {
    const path = `${fixturesDir}/${name}.html`;
    if (existsSync(path)) {
      return { status: 200, type: "text/html", body: page(name, readFileSync(path, "utf8")) };
    }
    return null;
  }

  const filePath = findFixture(name);
  if (filePath) {
    // `.vue` SFCs always SSR (script setup has an implicit default
    // export); `.ts`/`.tsx` are static only if they export a component
    // directly, otherwise they are dynamic (client-mounted) fixtures.
    const isStatic =
      filePath.endsWith(".vue") || /^export default/m.test(readFileSync(filePath, "utf8"));
    if (isStatic) {
      return { status: 200, type: "text/html", body: page(name, await ssr(name, filePath)) };
    }
    return {
      status: 200,
      type: "text/html",
      body: page(
        name,
        `<div id="root"></div>\n  <script type="module" src="/bundle/${name}.js"></script>`,
      ),
    };
  }
  return null;
};

const send = (res: ServerResponse, reply: Reply): void => {
  const headers: Record<string, string> = {};
  if (reply.type) headers["Content-Type"] = reply.type;
  if (reply.location) headers.Location = reply.location;
  res.writeHead(reply.status, headers);
  res.end(reply.body);
};

createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const cached = cache.get(pathname);
  if (cached) {
    send(res, cached);
    return;
  }
  void resolve(pathname).then((reply) => {
    if (reply) {
      cache.set(pathname, reply);
      send(res, reply);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}).listen(4000);

console.log("Test server running on http://localhost:4000");
