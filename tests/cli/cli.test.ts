import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

// Black-box tests of the CLI as it ships: `node dist/cli.js` (run
// `bun run build` first) in throwaway projects. A fake package manager on
// PATH records what would be installed, so nothing touches the network.

const pkg = fileURLToPath(new URL("../..", import.meta.url));
const cli = join(pkg, "dist/cli.js");
const { version } = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
const scratch = mkdtempSync(join(tmpdir(), "monochrome-cli-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const bin = join(scratch, "bin");
mkdirSync(bin);
// Records each install, declares the packages in package.json, and puts
// monochrome in node_modules at the version asked for.
const fake = `#!/usr/bin/env node
const { appendFileSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const [, , ...args] = process.argv;
appendFileSync(process.env.FAKE_INSTALL_LOG, [require("node:path").basename(process.argv[1]), ...args].join(" ") + "\\n");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const spec of args.slice(1).filter((arg) => !arg.startsWith("-"))) {
  const [name, version = "*"] = spec.split(/(?<=.)@/);
  pkg.dependencies = { ...pkg.dependencies, [name]: version };
  if (name === "monochrome") {
    mkdirSync("node_modules/monochrome", { recursive: true });
    writeFileSync("node_modules/monochrome/package.json", JSON.stringify({ version }));
  }
}
writeFileSync("package.json", JSON.stringify(pkg));
`;
for (const manager of ["npm", "pnpm", "yarn"]) {
  writeFileSync(join(bin, manager), fake);
  chmodSync(join(bin, manager), 0o755);
}

const components = Object.keys(
  JSON.parse(readFileSync(join(pkg, "templates/manifest.json"), "utf8")).components,
);

let count = 0;

/** Files by path; null leaves out a file a preset would write. */
type Files = Record<string, string | null>;

/** A project folder with these files. `installed` puts monochrome at that
 *  version in node_modules, as an install would. */
const project = (files: Files, installed: string | null = version) => {
  const dir = join(scratch, `project-${++count}`);
  for (const [path, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  mkdirSync(dir, { recursive: true });
  if (installed) {
    mkdirSync(join(dir, "node_modules/monochrome"), { recursive: true });
    writeFileSync(
      join(dir, "node_modules/monochrome/package.json"),
      JSON.stringify({ version: installed }),
    );
  }
  return dir;
};

const packageJson = (deps: Record<string, string>, devDeps: Record<string, string> = {}) =>
  JSON.stringify({ name: "app", private: true, dependencies: deps, devDependencies: devDeps });

const viteApp = (extra: Files = {}, installed: string | null = version) =>
  project(
    {
      "package.json": packageJson(
        { monochrome: version, react: "^19.0.0", "react-dom": "^19.0.0" },
        { vite: "^7.0.0" },
      ),
      "package-lock.json": "{}",
      "src/main.tsx": 'import "./index.css";\n',
      "tsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
      ...extra,
    },
    installed,
  );

/** A Vite Vue app with monochrome declared and installed. */
const vueApp = (extra: Files = {}, installed: string | null = version) =>
  project(
    {
      "package.json": packageJson({ monochrome: version, vue: "^3.5.0" }, { vite: "^7.0.0" }),
      "package-lock.json": "{}",
      "src/main.ts": 'import "./style.css";\n',
      "tsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
      ...extra,
    },
    installed,
  );

const run = (cwd: string, args: string[], env: Record<string, string> = {}) => {
  const log = join(cwd, ".install-log");
  const result = spawnSync("node", [cli, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_INSTALL_LOG: log,
      NO_COLOR: "1",
      PATH: `${bin}:${process.env.PATH}`,
      npm_config_user_agent: "",
      ...env,
    },
  });
  return {
    code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    installs: existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [],
  };
};

const read = (dir: string, path: string) => readFileSync(join(dir, path), "utf8");

const config = (dir: string) => JSON.parse(read(dir, "monochrome.json"));

describe("add", () => {
  test("writes the parts and settings, no CSS, and prints an example", () => {
    const dir = viteApp();
    const result = run(dir, ["add", "dropdown"]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(
      read(dir, "src/components/ui/menu.tsx"),
      new RegExp(`^// monochrome@${version} menu\\.tsx`),
    );
    assert.match(read(dir, "src/components/ui/menu.tsx"), /import "monochrome\/menu";/);
    assert.ok(!existsSync(join(dir, "src/styles")));
    assert.deepEqual(config(dir), {
      framework: "react",
      paths: { components: "src/components/ui" },
    });
    assert.match(result.stdout, /^import \{ Menu \} from "@\/components\/ui\/menu";/);
    assert.doesNotMatch(result.stderr, /^Load /m);
    assert.match(
      result.stderr,
      /Required: copy the Required CSS from node_modules\/monochrome\/spec\/menu\.md/,
    );
    assert.match(result.stderr, /Style it with the project's own styles/);
    assert.deepEqual(result.installs, []);
  });

  test("installs monochrome at its own version when the project lacks it", () => {
    const dir = project(
      {
        "package.json": packageJson({ react: "^19.0.0" }),
        "package-lock.json": "{}",
      },
      null,
    );
    const result = run(dir, ["add", "tooltip"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, [`npm install monochrome@${version}`]);
    assert.ok(existsSync(join(dir, "components/ui/tooltip.jsx")));
  });

  test("uses the project's package manager", () => {
    const dir = project(
      { "package.json": packageJson({ react: "^19.0.0" }), "pnpm-lock.yaml": "" },
      null,
    );
    assert.deepEqual(run(dir, ["add", "tabs"]).installs, [`pnpm add monochrome@${version}`]);
    const pinned = project(
      {
        "package.json": JSON.stringify({
          packageManager: "pnpm@9.1.0+sha512.abc",
          dependencies: { react: "^19.0.0" },
        }),
      },
      null,
    );
    assert.deepEqual(run(pinned, ["add", "tabs"]).installs, [`pnpm add monochrome@${version}`]);
  });

  test("writes JavaScript parts when the project has no tsconfig", () => {
    const dir = project({
      "package.json": packageJson({ monochrome: version, react: "^19.0.0" }),
      "package-lock.json": "{}",
      "src/index.js": 'import "./index.css";\n',
    });
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(
      read(dir, "src/components/ui/menu.jsx"),
      new RegExp(`^// monochrome@${version} menu\\.jsx: yours to edit\\.\\n"use client";\\n`),
    );
    assert.ok(!existsSync(join(dir, "src/components/ui/menu.tsx")));
    assert.match(result.stdout, /^import \{ Menu \} from "\.\/components\/ui\/menu";/);
    assert.match(result.stderr, /import path works from a file in src\//);
  });

  test("prints a core line for markup when the entry is unknown", () => {
    const dir = viteApp({ "src/main.tsx": null, "src/App.tsx": "" });
    assert.match(
      run(dir, ["add", "menu", "--framework", "html"]).stderr,
      /Load the core once, in your app entry \(the path works from a file in src\/\):\n {2}import "monochrome";/,
    );
  });

  test("follows tsconfig extends to the most specific alias", () => {
    const dir = viteApp({
      "tsconfig.json": '{\n  // Paths live in config/.\n  "extends": ["./config/paths"],\n}\n',
      "config/paths.json":
        '{ "compilerOptions": { "paths": { "@/*": ["../src/*"], "#ui/*": ["../src/components/ui/*"], }, }, }',
    });
    assert.match(run(dir, ["add", "menu"]).stdout, /^import \{ Menu \} from "#ui\/menu";/);
  });

  test("resolves paths against baseUrl, and reads jsconfig.json", () => {
    const based = viteApp({
      "tsconfig.json": '{ "compilerOptions": { "baseUrl": "./src", "paths": { "~/*": ["*"] } } }',
    });
    assert.match(
      run(based, ["add", "menu"]).stdout,
      /^import \{ Menu \} from "~\/components\/ui\/menu";/,
    );
    const js = viteApp({
      "tsconfig.json": null,
      "jsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
    });
    const result = run(js, ["add", "menu"]);
    assert.match(result.stdout, /^import \{ Menu \} from "@\/components\/ui\/menu";/);
    assert.ok(existsSync(join(js, "src/components/ui/menu.jsx")));
  });

  test("reads folder flags from where it runs, and saves them from the root", () => {
    const dir = viteApp();
    const result = run(join(dir, "src"), ["add", "menu", "--components", "./ui/"]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(existsSync(join(dir, "src/ui/menu.tsx")));
    assert.equal(config(dir).paths.components, "src/ui");
    assert.match(result.stdout, /^import \{ Menu \} from "@\/ui\/menu";/);
  });

  test("writes into the package it runs in, not a workspace root above it", () => {
    const dir = project({
      "package.json": JSON.stringify({ workspaces: ["apps/*"] }),
      "monochrome.json": JSON.stringify({ paths: { components: "ui" } }),
      "apps/web/package.json": packageJson({ monochrome: version, react: "^19.0.0" }),
    });
    const result = run(join(dir, "apps/web"), ["add", "tabs"]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(existsSync(join(dir, "apps/web/components/ui/tabs.jsx")));
    assert.ok(!existsSync(join(dir, "ui")));
  });

  test("names the React apps when run at a workspace root", () => {
    const dir = project(
      {
        "package.json": JSON.stringify({ workspaces: { packages: ["apps/*", "packages/*"] } }),
        "apps/web/package.json": packageJson({ react: "^19.0.0" }),
        "apps/api/package.json": packageJson({ hono: "^4.0.0" }),
        "packages/ui/package.json": packageJson({}, { react: "^19.0.0" }),
      },
      null,
    );
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /workspace root[\s\S]*folder: apps\/web, packages\/ui\./);
    const pnpm = project(
      {
        "package.json": packageJson({}),
        "pnpm-workspace.yaml": 'packages:\n  - "apps/*" # the apps\n',
        "apps/site/package.json": packageJson({ react: "^19.0.0" }),
      },
      null,
    );
    assert.match(run(pnpm, ["add", "menu"]).stderr, /folder: apps\/site\./);
  });

  test("changes nothing when run again", () => {
    const dir = viteApp();
    const first = run(dir, ["add", "menu"]);
    const again = run(dir, ["add", "menu"]);
    assert.equal(again.code, 0, again.stderr);
    assert.doesNotMatch(again.stderr, /^(created|updated) /m);
    assert.equal(again.stdout, first.stdout);
    assert.deepEqual(again.installs, []);
  });

  test("writes a component once when its names and aliases repeat", () => {
    const dir = viteApp();
    const result = run(dir, ["add", "dropdown", "Menu", "dropdown-menu"]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stderr.match(/^created {3}src\/components\/ui\/menu\.tsx$/gm)?.length, 1);
    assert.doesNotMatch(result.stdout, /^\/\/ menu$/m);
  });

  test("stops on a monochrome.json of the wrong shape, and keeps it", () => {
    const dir = viteApp({ "monochrome.json": '{ "framework": "svelte" }' });
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /monochrome\.json needs "framework": "html", "react", or "vue"/);
    assert.equal(read(dir, "monochrome.json"), '{ "framework": "svelte" }');
    const paths = viteApp({ "monochrome.json": '{ "framework": "react", "paths": null }' });
    assert.match(run(paths, ["add", "menu"]).stderr, /needs "paths"/);
    const missing = viteApp({ "monochrome.json": '{ "paths": { "components": "src/ui" } }' });
    assert.match(run(missing, ["add", "menu"]).stderr, /needs "framework"/);
  });

  test("saves flags, so the next run writes to the same place", () => {
    const dir = viteApp();
    run(dir, ["add", "menu", "--components", "src/ui"]);
    run(dir, ["add", "dialog"]);
    assert.ok(existsSync(join(dir, "src/ui/dialog.tsx")));
    assert.equal(config(dir).paths.components, "src/ui");
  });

  test("writes a component's requirements, and keeps files that exist", () => {
    const dir = viteApp({ "src/components/ui/menu.tsx": "// mine\n" });
    const result = run(dir, ["add", "menubar"]);
    assert.ok(existsSync(join(dir, "src/components/ui/menubar.tsx")));
    assert.equal(read(dir, "src/components/ui/menu.tsx"), "// mine\n");
    assert.match(result.stderr, /kept {6}src\/components\/ui\/menu\.tsx$/m);
  });

  test("prepends use client to the example in Next.js", () => {
    const dir = project({
      "package.json": packageJson({ monochrome: version, next: "16.0.0", react: "^19.0.0" }),
      "package-lock.json": "{}",
      "app/layout.tsx": "export default function Layout() {}\n",
    });
    const result = run(dir, ["add", "menu"]);
    assert.match(
      result.stdout,
      /^"use client";\n\nimport \{ Menu \} from "\.\.\/components\/ui\/menu";/,
    );
    assert.match(
      result.stderr,
      /Check the rendered HTML against node_modules\/monochrome\/spec\/conventions\.md/,
    );
  });

  test("stops before writing when the installed core is another version", () => {
    const dir = viteApp({}, "0.1.0");
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      new RegExp(`has monochrome@0\\.1\\.0, but this is the monochrome@${version} CLI`),
    );
    assert.match(result.stderr, new RegExp(`npx monochrome@${version} changelog --from 0\\.1\\.0`));
    assert.ok(!existsSync(join(dir, "src/components/ui/menu.tsx")));
    assert.ok(!existsSync(join(dir, "monochrome.json")));
  });

  test("stops when monochrome is declared but not installed", () => {
    const dir = viteApp({}, null);
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /in package\.json but not installed/);
    assert.deepEqual(result.installs, []);
  });

  test("prints the markup and the core line in a project without React", () => {
    const dir = project(
      {
        "package.json": packageJson({ svelte: "^5.0.0" }),
        "package-lock.json": "{}",
        "src/main.ts": "",
      },
      null,
    );
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, [`npm install monochrome@${version}`]);
    assert.ok(!existsSync(join(dir, "src/components")));
    assert.ok(!existsSync(join(dir, "src/styles")));
    assert.equal(config(dir).framework, "html");
    assert.match(result.stdout, /^<button type="button" id="mct:menu:/);
    assert.match(
      result.stderr,
      /Load the core once, in src\/main\.ts:\n {2}import "monochrome";\n/,
    );
    assert.match(result.stderr, /Required: copy the Required CSS/);
    assert.match(result.stderr, /Paste the markup where it belongs/);
  });

  test("loads the core in the browser from a Next.js or Astro layout", () => {
    const next = project({
      "package.json": packageJson({ monochrome: version, next: "14.2.0", react: "^18.3.0" }),
      "package-lock.json": "{}",
      "tsconfig.json": "{}",
      "app/layout.tsx": "export default function Layout() {}\n",
    });
    const fromNext = run(next, ["add", "menu", "--framework", "html"]);
    assert.equal(fromNext.code, 0, fromNext.stderr);
    assert.match(
      fromNext.stderr,
      /Load the core once, in app\/monochrome\.tsx:\n {2}"use client";\n {2}import "monochrome";\n[\s\S]*\nThen render <Monochrome \/> once in app\/layout\.tsx\./,
    );
    const astro = project({
      "package.json": packageJson({ monochrome: version, astro: "^5.0.0" }),
      "package-lock.json": "{}",
      "src/layouts/Layout.astro": "<slot />\n",
    });
    const fromAstro = run(astro, ["add", "tabs"]);
    assert.equal(fromAstro.code, 0, fromAstro.stderr);
    assert.match(
      fromAstro.stderr,
      /in src\/layouts\/Layout\.astro:\n {2}<script>import "monochrome";<\/script>\n/,
    );
  });

  test("stops in a folder that does not look like a project", () => {
    const dir = project({ "notes.txt": "" }, null);
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /does not look like a project/);
    assert.ok(!existsSync(join(dir, "monochrome.json")));
  });

  test("loads from a CDN, and installs nothing, without a package.json", () => {
    const dir = project({ "index.html": "" }, null);
    const result = run(dir, ["add", "dialog"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, []);
    assert.ok(!existsSync(join(dir, "styles")));
    assert.doesNotMatch(result.stderr, /<link /);
    assert.doesNotMatch(result.stderr, /Required:/);
    assert.match(
      result.stderr,
      new RegExp(
        `cdn\\.jsdelivr\\.net/npm/monochrome@${version.replaceAll(".", "\\.")}/dist/index\\.js`,
      ),
    );
    assert.match(
      result.stderr,
      new RegExp(`npx monochrome@${version.replaceAll(".", "\\.")} docs dialog`),
    );
  });

  test("prints markup for React with --framework html", () => {
    const dir = viteApp();
    const result = run(dir, ["add", "tabs", "--framework", "html"]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(!existsSync(join(dir, "src/components/ui/tabs.tsx")));
    assert.match(result.stdout, /^<div id="mcr:tabs:/);
  });

  test("--dry-run reports the changes and writes nothing", () => {
    const dir = project(
      { "package.json": packageJson({ react: "^19.0.0" }), "package-lock.json": "{}" },
      null,
    );
    const result = run(dir, ["add", "menu", "--dry-run"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, []);
    assert.match(result.stderr, /^created {3}components\/ui\/menu\.jsx$/m);
    assert.match(result.stderr, new RegExp(`install {3}npm install monochrome@${version}`));
    assert.ok(!existsSync(join(dir, "components")));
    assert.ok(!existsSync(join(dir, "monochrome.json")));
  });

  test("--json prints the result, or the error, as JSON alone", () => {
    const dir = viteApp();
    const result = run(dir, ["add", "menu", "--json"]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stderr, "");
    const json = JSON.parse(result.stdout);
    assert.equal(json.framework, "react");
    assert.deepEqual(
      json.files.map((row: { path: string }) => row.path),
      ["src/components/ui/menu.tsx", "monochrome.json"],
    );
    assert.equal(json.examples[0].language, "tsx");
    assert.deepEqual(json.load, []);
    assert.deepEqual(json.styling.required, [
      { component: "menu", spec: "node_modules/monochrome/spec/menu.md" },
    ]);
    const failed = run(dir, ["add", "carousel", "--json"]);
    assert.equal(failed.code, 2);
    assert.match(JSON.parse(failed.stdout).error, /unknown component "carousel"/);
    const help = run(dir, ["add", "--help", "--json"]);
    assert.match(help.stdout, /^Usage/);
  });

  test("stops before anything when the project runs React 18", () => {
    const installed = viteApp({ "node_modules/react/package.json": '{ "version": "18.3.1" }' });
    const result = run(installed, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /React 19 components, and this project has React 18/);
    assert.match(result.stderr, /node_modules\/monochrome\/spec\/menu\.md/);
    assert.match(result.stderr, /--framework html/);
    assert.ok(!existsSync(join(installed, "src/components/ui/menu.tsx")));
    assert.ok(!existsSync(join(installed, "monochrome.json")));
    const declared = project({
      "package.json": packageJson({ react: "^18.2.0" }),
      "package-lock.json": "{}",
    });
    assert.equal(run(declared, ["add", "menu"]).code, 1);
    assert.deepEqual(run(declared, ["add", "menu"]).installs, []);
  });

  test("writes the Vue parts as a folder per component in a Vue project", () => {
    const dir = vueApp();
    const result = run(dir, ["add", "menubar"]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(config(dir).framework, "vue");
    for (const file of ["menu/index.ts", "menu/Root.vue", "menubar/index.ts", "menubar/Menu.vue"]) {
      assert.ok(existsSync(join(dir, "src/components/ui", file)), file);
    }
    assert.match(
      read(dir, "src/components/ui/menu/Root.vue"),
      new RegExp(
        `^<!-- monochrome@${version} menu/Root\\.vue: yours to edit\\. -->\\n<script setup`,
      ),
    );
    assert.match(
      read(dir, "src/components/ui/menu/index.ts"),
      new RegExp(
        `^// monochrome@${version} menu/index\\.ts: yours to edit\\.\\nimport "monochrome/menu";`,
      ),
    );
    assert.ok(!existsSync(join(dir, "src/components/ui/menu.tsx")));
    assert.match(
      result.stdout,
      /^<script setup lang="ts">\nimport \{ Menubar \} from "@\/components\/ui\/menubar";/,
    );
  });

  test("stops before anything when the project runs Vue 3.4", () => {
    const dir = vueApp({ "node_modules/vue/package.json": '{ "version": "3.4.38" }' });
    const result = run(dir, ["add", "menu"]);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /Vue 3\.5 components \(they use useId\), and this project has Vue 3\.4/,
    );
    assert.match(result.stderr, /--framework html/);
    assert.ok(!existsSync(join(dir, "src/components/ui/menu")));
    assert.ok(!existsSync(join(dir, "monochrome.json")));
  });

  test("lists the components when given none", () => {
    const result = run(viteApp(), ["add"]);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /Components: accordion, collapsible, dialog/);
  });

  test("exits 2 for an unknown component or flag, and accepts --yes", () => {
    const dir = viteApp();
    assert.equal(run(dir, ["add", "carousel"]).code, 2);
    assert.match(run(dir, ["add", "constructor"]).stderr, /unknown component "constructor"/);
    assert.match(run(dir, ["add", "menu", "--style=css"]).stderr, /unknown option --style/);
    assert.match(run(dir, ["add", "menu", "--components"]).stderr, /--components needs a value/);
    assert.equal(run(dir, ["add", "menu", "--yes"]).code, 0);
  });
});

describe("JavaScript files", () => {
  test("parse without TypeScript, and keep the header and use client, no comments", () => {
    const script = `
      const { parseSync } = require("@babel/core");
      const { readdirSync, readFileSync } = require("node:fs");
      const files = ["react", "examples"].flatMap((dir) =>
        readdirSync("dist/files/" + dir)
          .filter((file) => file.endsWith(".jsx"))
          .map((file) => dir + "/" + file),
      );
      for (const file of files) {
        parseSync(readFileSync("dist/files/" + file, "utf8"), {
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ["jsx"] },
        });
      }
      console.log(JSON.stringify(files));
    `;
    const result = spawnSync("node", ["-e", script], { cwd: pkg, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const files: string[] = JSON.parse(result.stdout);
    assert.equal(files.length, components.length * 2);
    for (const file of files.filter((path) => path.startsWith("react/"))) {
      const source = readFileSync(join(pkg, "dist/files", file), "utf8");
      const header = new RegExp(
        `^// monochrome@${version} ${basename(file)}: yours to edit\\.\\n"use client";\\n`,
      );
      assert.match(source, header);
      assert.doesNotMatch(source.replace(header, ""), /\/\/|\/\*/);
    }
  });
});

describe("init", () => {
  /** A project that already has monochrome, so init only writes the block. */
  const installed = {
    "package.json": packageJson({ monochrome: version }),
    "package-lock.json": "{}",
  };

  test("installs monochrome and writes the AGENTS.md block once", () => {
    const dir = project(
      { "package.json": packageJson({ react: "^19.0.0" }), "package-lock.json": "{}" },
      null,
    );
    const first = run(dir, ["init"]);
    assert.equal(first.code, 0, first.stderr);
    assert.deepEqual(first.installs, [`npm install monochrome@${version}`]);
    assert.match(
      read(dir, "AGENTS.md"),
      /<!-- BEGIN:monochrome-agent-rules -->[\s\S]*<!-- END:monochrome-agent-rules -->\n$/,
    );
    assert.match(run(dir, ["init"]).stdout, /unchanged {3}AGENTS\.md/);
    assert.deepEqual(config(dir), {
      framework: "react",
      paths: { components: "components/ui" },
    });
  });

  test("saves the framework for add, and changes nothing on --dry-run", () => {
    const dir = project(installed);
    const dry = run(dir, ["init", "--dry-run"]);
    assert.equal(dry.code, 0, dry.stderr);
    assert.ok(!existsSync(join(dir, "AGENTS.md")));
    assert.ok(!existsSync(join(dir, "monochrome.json")));
    run(dir, ["init"]);
    assert.equal(config(dir).framework, "html");
  });

  test("keeps the rest of AGENTS.md and its line endings", () => {
    const dir = project({ ...installed, "AGENTS.md": "# Rules\r\n\r\nBe kind.\r\n" });
    run(dir, ["init"]);
    const text = read(dir, "AGENTS.md");
    assert.match(
      text,
      /^# Rules\r\n\r\nBe kind\.\r\n\r\n<!-- BEGIN:monochrome-agent-rules -->\r\n/,
    );
    assert.ok(!/[^\r]\n/.test(text));
  });

  test("stops before installing when a marker was removed by hand", () => {
    const dir = project(
      {
        "package.json": packageJson({}),
        "AGENTS.md": "<!-- BEGIN:monochrome-agent-rules -->\nedited\n",
      },
      null,
    );
    const result = run(dir, ["init"]);
    assert.equal(result.code, 1);
    assert.equal(read(dir, "AGENTS.md"), "<!-- BEGIN:monochrome-agent-rules -->\nedited\n");
    assert.deepEqual(result.installs, []);
  });

  test("adds to a pnpm workspace root with -w", () => {
    const dir = project(
      {
        "package.json": packageJson({}),
        "pnpm-lock.yaml": "",
        "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
      },
      null,
    );
    const result = run(dir, ["init"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, [`pnpm add -w monochrome@${version}`]);
  });

  test("adds to a Yarn 1 workspace root with -W", () => {
    const dir = project(
      {
        "package.json": JSON.stringify({ private: true, workspaces: ["apps/*"] }),
        "yarn.lock": "",
      },
      null,
    );
    const result = run(dir, ["init"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, [`yarn add -W monochrome@${version}`]);
  });

  test("exits 2 when given an argument, and writes nothing", () => {
    const dir = project(installed);
    assert.equal(run(dir, ["init", "menu"]).code, 2);
    assert.ok(!existsSync(join(dir, "AGENTS.md")));
  });

  test("points out a project CLAUDE.md that does not import AGENTS.md", () => {
    const hidden = project({ ...installed, "CLAUDE.md": "# Notes\n" });
    assert.match(run(hidden, ["init"]).stderr, /Add a line with @AGENTS\.md to CLAUDE\.md/);
    const json = JSON.parse(run(hidden, ["init", "--json"]).stdout);
    assert.match(json.warnings[0], /@AGENTS\.md/);
    const imported = project({ ...installed, "CLAUDE.md": "@AGENTS.md\n" });
    assert.doesNotMatch(run(imported, ["init"]).stderr, /CLAUDE\.md/);
  });

  test("sets up a project without a package.json, pointing at npx docs", () => {
    const dir = project({ "index.html": "" }, null);
    const result = run(dir, ["init"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.installs, []);
    const pinned = `npx monochrome@${version.replaceAll(".", "\\.")}`;
    assert.match(read(dir, "AGENTS.md"), new RegExp(`${pinned} docs choosing`));
    assert.match(read(dir, "AGENTS.md"), new RegExp(`Run \`${pinned} add <component>\``));
    assert.match(result.stdout, new RegExp(`${pinned} add menu`));
    assert.equal(config(dir).framework, "html");
  });

  test("stops in a folder that does not look like a project, and writes nothing", () => {
    const dir = project({ "notes.txt": "" }, null);
    const result = run(dir, ["init"]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /does not look like a project/);
    assert.ok(!existsSync(join(dir, "AGENTS.md")));
  });
});

describe("docs", () => {
  test("lists every topic with its description", () => {
    const result = run(scratch, ["docs"]);
    assert.equal(result.code, 0, result.stderr);
    for (const name of [...components, "choosing", "conventions", "router", "styling"])
      assert.match(result.stdout, new RegExp(`^ {2}${name} +\\S`, "m"));
    const description = /^description: (.+)$/m.exec(read(pkg, "spec/collapsible.md"))?.[1];
    assert.ok(result.stdout.split("\n").some((line) => line.endsWith(` ${description}`)));
  });

  test("prints a spec page, by name or alias", () => {
    const result = run(scratch, ["docs", "Dropdown"]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout, `${read(pkg, "spec/menu.md").trimEnd()}\n`);
  });

  test("exits 2 for an unknown topic or a second one", () => {
    const unknown = run(scratch, ["docs", "carousel"]);
    assert.equal(unknown.code, 2);
    assert.match(unknown.stderr, /Topics: accordion, choosing, collapsible/);
    assert.equal(run(scratch, ["docs", "menu", "tabs"]).code, 2);
  });
});

describe("changelog", () => {
  const headings = (stdout: string) =>
    Array.from(stdout.matchAll(/^## \S+/gm), (match) => match[0]);

  test("prints the newest entry by default", () => {
    const result = run(scratch, ["changelog"]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(headings(result.stdout).length, 1);
    assert.match(result.stdout, /^## /);
  });

  test("prints the entries after --from, up to --to", () => {
    const result = run(scratch, ["changelog", "--from", "0.14.0", "--to", "v0.16"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(headings(result.stdout), ["## 0.16.0", "## 0.15.0"]);
  });

  test("starts from the version the project has", () => {
    const dir = viteApp({}, "0.16.0");
    const result = run(dir, ["changelog"]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(headings(result.stdout).includes("## 0.17.0"));
    assert.ok(!headings(result.stdout).includes("## 0.16.0"));
    assert.match(result.stderr, /since monochrome@0\.16\.0, the version this project has/);
  });

  test("says so when nothing matches, and exits 2 for a bad version", () => {
    const none = run(scratch, ["changelog", "--from", "99.0.0", "--to", "99.1.0"]);
    assert.equal(none.code, 0);
    assert.equal(none.stdout, "");
    assert.match(none.stderr, /No changes after 99\.0\.0 up to 99\.1\.0/);
    assert.equal(run(scratch, ["changelog", "--from", "latest"]).code, 2);
    assert.equal(run(scratch, ["changelog", "0.17.0"]).code, 2);
  });
});

describe("help", () => {
  test("lists every command and prints the version", () => {
    const result = run(scratch, ["help"]);
    for (const name of ["init", "add", "docs", "changelog"])
      assert.match(result.stdout, new RegExp(`^ {2}${name}\\b`, "m"));
    assert.equal(run(scratch, ["--version"]).stdout.trim(), version);
    assert.match(run(scratch, ["add", "--help"]).stdout, /--components <dir>/);
    assert.equal(run(scratch, ["deploy"]).code, 2);
    assert.match(run(scratch, ["changelog", "--help"]).stdout, /--from <version>/);
  });
});
