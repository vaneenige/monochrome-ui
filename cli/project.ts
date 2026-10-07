import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { posix } from "./config.js";
import { Problem } from "./ui.js";

/** The project a command runs in, read once. */
export type Project = {
  /** The nearest folder with a package.json, else the working folder. */
  root: string;
  pkg: Record<string, unknown> | null;
  /** Every name in its dependencies, devDependencies, and
   *  peerDependencies. */
  deps: Set<string>;
  /** Next.js: an example that passes handlers needs "use client". */
  next: boolean;
  /** The React file extension: tsx when the project has a tsconfig (the
   *  signal shadcn uses too), else jsx. */
  ext: "jsx" | "tsx";
};

export const readJson = (path: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...parsed } : null;
  } catch {
    return null;
  }
};

const dependencies = (pkg: Record<string, unknown> | null) => {
  const names = new Set<string>();
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const value = pkg?.[field];
    if (value && typeof value === "object") for (const name of Object.keys(value)) names.add(name);
  }
  return names;
};

/** The nearest folder with a package.json, not past the repository
 *  root, else `cwd`. */
const packageRoot = (cwd: string) => {
  for (let dir = cwd; ; dir = dirname(dir)) {
    if (existsSync(join(dir, "package.json"))) return dir;
    if (existsSync(join(dir, ".git")) || dirname(dir) === dir) return cwd;
  }
};

export const loadProject = (cwd: string): Project => {
  const root = packageRoot(cwd);
  const pkg = readJson(join(root, "package.json"));
  const deps = dependencies(pkg);
  const typescript = readdirSync(root).some((file) => /^tsconfig(\..+)?\.json$/.test(file));
  return { root, pkg, deps, next: deps.has("next"), ext: typescript ? "tsx" : "jsx" };
};

const has = (project: Project, path: string) => existsSync(join(project.root, path));

/** Files that mark a project folder without a package.json: version
 *  control, or a server stack's own manifest. */
const projectMarkers = [
  ".git",
  "build.gradle",
  "Cargo.toml",
  "composer.json",
  "Gemfile",
  "go.mod",
  "index.html",
  "manage.py",
  "mix.exs",
  "pom.xml",
  "pyproject.toml",
  "requirements.txt",
];

/** Stops in a folder that does not look like a project, where `init`
 *  or `add` would leave files in the wrong place. */
export const requireProject = (project: Project, version: string) => {
  if (project.pkg || projectMarkers.some((file) => has(project, file))) return;
  throw new Problem(
    "this folder does not look like a project",
    `Run it in your project's folder (one with a package.json, a .git folder, or your stack's project file). Without a build step, load monochrome with a script tag: https://cdn.jsdelivr.net/npm/monochrome@${version}/dist/index.js`,
  );
};

/** A folder's workspace patterns (package.json `workspaces`, or the
 *  `packages` list in pnpm-workspace.yaml), or null when it has none. */
const workspacePatterns = (project: Project): string[] | null => {
  const field: unknown = project.pkg?.workspaces;
  const listed: unknown =
    field && typeof field === "object" && "packages" in field ? field.packages : field;
  if (Array.isArray(listed)) return listed.filter((item) => typeof item === "string");
  if (!has(project, "pnpm-workspace.yaml")) return null;
  const patterns: string[] = [];
  let inList = false;
  for (const line of readFileSync(join(project.root, "pnpm-workspace.yaml"), "utf8").split("\n")) {
    if (/^\S/.test(line)) inList = /^packages:\s*$/.test(line);
    const item = inList && /^\s+-\s*["']?([^"'#\s]+)/.exec(line)?.[1];
    if (item) patterns.push(item);
  }
  return patterns[0] ? patterns : null;
};

/** At a workspace root, the packages under it that depend on react or
 *  vue (as far as `dir/*` patterns and plain folders go), else null. */
export const workspaceApps = (project: Project): string[] | null => {
  const patterns = workspacePatterns(project);
  if (!patterns) return null;
  const folders = patterns.flatMap((pattern) => {
    const clean = pattern.replace(/^\.\//, "").replace(/\/+$/, "");
    const parent = /^([^!*]*)\/\*{1,2}$/.exec(clean)?.[1];
    if (parent === undefined) return /[!*]/.test(clean) ? [] : [clean];
    const dir = join(project.root, parent);
    return existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => `${parent}/${entry.name}`)
          .sort()
      : [];
  });
  return folders.filter((folder) =>
    ["react", "vue"].some((name) =>
      dependencies(readJson(join(project.root, folder, "package.json"))).has(name),
    ),
  );
};

/** Where React parts go without a monochrome.json: under `src/` when
 *  there is one. */
export const defaultComponents = (project: Project) =>
  `${has(project, "src") ? "src/" : ""}components/ui`;

/** App entry files, in the order they are tried: Next.js layouts,
 *  script entries (Vite, React Router), then the layouts of SvelteKit
 *  and Astro. */
const entries = (project: Project) =>
  project.next
    ? ["src/app/layout", "app/layout", "src/pages/_app", "pages/_app"].flatMap((base) =>
        ["tsx", "jsx", "js"].map((ext) => `${base}.${ext}`),
      )
    : [
        ...["src/main", "src/index", "app/root"].flatMap((base) =>
          ["tsx", "jsx", "ts", "js"].map((ext) => `${base}.${ext}`),
        ),
        "src/routes/+layout.svelte",
        "src/layouts/Layout.astro",
      ];

/** The app's entry file, and the folder its code lives in: the entry's,
 *  else `src/` when there is one. Paths `add` prints start from there. */
export const appEntry = (project: Project) => {
  const file = entries(project).find((path) => has(project, path)) || null;
  return { file, folder: file ? dirname(file) : has(project, "src") ? "src" : "." };
};

/** An import specifier for `to`, from a file in `folder` (both from the
 *  project root): `./components/ui`. */
export const importFrom = (project: Project, folder: string, to: string) => {
  const path = posix(relative(resolve(project.root, folder), resolve(project.root, to)));
  return /^\.\.?(\/|$)/.test(path) ? path : `./${path}`;
};

/** A place to load the core, and the lines that go there. `file` is
 *  null when no known file matched; the lines then import from `folder`
 *  (or are tags for every page's head). `afterwards` is a last step. */
export type Load = {
  file: string | null;
  folder: string;
  place: string;
  lines: string[];
  afterwards?: string;
};

/** Whether the project builds its pages from a script entry (a bundler
 *  resolves imports), rather than serving pages that load files by URL:
 *  when there is a known entry, or a package.json with a `src/` folder. */
const bundled = (project: Project) =>
  appEntry(project).file !== null || (project.pkg !== null && has(project, "src"));

const head = (lines: string[]): Load => ({
  file: null,
  folder: ".",
  place: "every page's <head>",
  lines,
});

/** Where markup loads the core, once: an import in the script entry, or
 *  a script tag pinned to this version. */
const coreLoad = (project: Project, version: string): Load => {
  if (!bundled(project)) {
    return head([
      `<script type="module" src="https://cdn.jsdelivr.net/npm/monochrome@${version}/dist/index.js"></script>`,
    ]);
  }
  const { file, folder } = appEntry(project);
  const place = "your app entry";
  // Both run their imports on the server only: Astro's frontmatter, and
  // a Next.js App Router layout (a Server Component).
  if (file?.endsWith(".astro")) {
    return { file, folder, place, lines: ['<script>import "monochrome";</script>'] };
  }
  if (file && /(^|\/)app\/layout\.\w+$/.test(file)) {
    return {
      file: `${folder}/monochrome.${project.ext}`,
      folder,
      place,
      lines: [
        '"use client";',
        'import "monochrome";',
        "export default function Monochrome() {",
        "  return null;",
        "}",
      ],
      afterwards: `Then render <Monochrome /> once in ${file}.`,
    };
  }
  return { file, folder, place, lines: ['import "monochrome";'] };
};

const loadsAlready = (project: Project, file: string) =>
  has(project, file) &&
  /(["'])monochrome(?:\/dist\/index\.js)?\1|monochrome@[^/"']*\/dist\/index\.js/.test(
    readFileSync(join(project.root, file), "utf8"),
  );

/** Where markup loads the core, and the line still missing there: none
 *  when a known file already has it. A line for an unknown place shows
 *  on the first run only. */
export const loads = (
  project: Project,
  options: { firstRun: boolean; version: string },
): Load[] => {
  const load = coreLoad(project, options.version);
  const missing = load.file ? !loadsAlready(project, load.file) : options.firstRun;
  return missing ? [load] : [];
};

/** JSON with comments and trailing commas, as tsconfig allows. */
const readJsonc = (path: string): Record<string, unknown> | null => {
  try {
    const text = readFileSync(path, "utf8")
      .replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (_, string) => string || "")
      .replace(/("(?:\\.|[^"\\])*")|,(?=\s*[}\]])/g, (_, string) => string || "");
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...parsed } : null;
  } catch {
    return null;
  }
};

type Aliases = { paths?: Record<string, unknown>; pathsDir?: string; baseUrl?: string };

/** A tsconfig's `paths`, with what they resolve against: `baseUrl` when
 *  one is set, else the folder of the file that declares them. `extends`
 *  (a path, a package, or since TS 5 a list) fills in what the file
 *  leaves out. */
const aliasesOf = (file: string, chain: string[] = []): Aliases => {
  const config = chain.includes(file) ? null : readJsonc(file);
  if (!config) return {};
  let aliases: Aliases = {};
  for (const parent of [config.extends].flat()) {
    if (typeof parent !== "string") continue;
    try {
      const path = createRequire(file).resolve(parent);
      aliases = { ...aliases, ...aliasesOf(path, [...chain, file]) };
    } catch {}
  }
  const options: Record<string, unknown> =
    config.compilerOptions && typeof config.compilerOptions === "object"
      ? { ...config.compilerOptions }
      : {};
  if (options.paths && typeof options.paths === "object") {
    aliases = { ...aliases, paths: { ...options.paths }, pathsDir: dirname(file) };
  }
  if (typeof options.baseUrl === "string") {
    aliases = { ...aliases, baseUrl: resolve(dirname(file), options.baseUrl) };
  }
  return aliases;
};

/** The configs that may declare the project's aliases: tsconfig.json,
 *  the configs it references (Vite's tsconfig.app.json), jsconfig.json. */
const configs = (root: string) => {
  const main = join(root, "tsconfig.json");
  const references = readJsonc(main)?.references;
  const referenced = (Array.isArray(references) ? references : []).flatMap((ref) => {
    const path: unknown = ref && typeof ref === "object" && "path" in ref && ref.path;
    if (typeof path !== "string") return [];
    const full = resolve(root, path);
    return [full.endsWith(".json") ? full : join(full, "tsconfig.json")];
  });
  return [main, ...referenced, join(root, "jsconfig.json")];
};

/** How the project imports its components folder: through the most
 *  specific tsconfig `paths` alias that covers it (`@/components/ui`),
 *  else null. */
export const importBase = (project: Project, components: string): string | null => {
  const folder = resolve(project.root, components);
  let best: { specifier: string; target: string } | null = null;
  for (const file of configs(project.root)) {
    const { paths = {}, pathsDir, baseUrl = pathsDir } = aliasesOf(file);
    for (const [alias, targets] of Object.entries(paths)) {
      const first: unknown = Array.isArray(targets) ? targets[0] : undefined;
      if (!alias.endsWith("/*") || typeof first !== "string" || !first.endsWith("*")) continue;
      const target = resolve(baseUrl ?? project.root, first.slice(0, -1));
      const rest = relative(target, folder);
      if (rest.startsWith("..") || isAbsolute(rest)) continue;
      if (!best || target.length > best.target.length) {
        best = { specifier: alias.slice(0, -2) + (rest ? `/${posix(rest)}` : ""), target };
      }
    }
  }
  return best ? best.specifier : null;
};
