import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { type Project, readJson } from "./project.js";
import { compareVersions, parseVersion, version } from "./spec.js";
import { err, note, Problem } from "./ui.js";

export type Manager = "bun" | "npm" | "pnpm" | "yarn";

type Detected = { name: Manager; reason: string };

const lockfiles: [file: string, manager: Manager][] = [
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
];

const isManager = (value: string | undefined): value is Manager =>
  value === "bun" || value === "npm" || value === "pnpm" || value === "yarn";

/** The package manager: `packageManager` or a lockfile in the project or
 *  any folder above it (a package inside a workspace uses the workspace's),
 *  else the one that ran this command (`pnpm dlx`, `bunx`), else npm. */
export const detectManager = (root: string): Detected => {
  for (let dir = root; ; dir = dirname(dir)) {
    const where = dir === root ? "" : ` in ${dir}`;
    const field = readJson(join(dir, "package.json"))?.packageManager;
    const named = typeof field === "string" ? field.split("@")[0] : undefined;
    if (isManager(named)) return { name: named, reason: `packageManager${where}` };
    for (const [file, name] of lockfiles) {
      if (existsSync(join(dir, file))) return { name, reason: `${file}${where}` };
    }
    if (dirname(dir) === dir) break;
  }
  const agent = /^(\w+)\//.exec(process.env.npm_config_user_agent ?? "")?.[1];
  if (isManager(agent)) return { name: agent, reason: `ran with ${agent}` };
  return { name: "npm", reason: "no lockfile" };
};

/** At a workspace root, pnpm and Yarn 1 refuse to add without this. */
const workspaceRootFlag = (root: string, manager: Manager) => {
  if (manager === "pnpm" && existsSync(join(root, "pnpm-workspace.yaml"))) return ["-w"];
  const yarnClassic = manager === "yarn" && !existsSync(join(root, ".yarnrc.yml"));
  return yarnClassic && readJson(join(root, "package.json"))?.workspaces ? ["-W"] : [];
};

const installCommand = (root: string, manager: Manager, packages: string[]) =>
  [
    manager,
    manager === "npm" ? "install" : "add",
    ...workspaceRootFlag(root, manager),
    ...packages,
  ].join(" ");

/** The version of a package the project resolves, found the way Node
 *  looks: node_modules in the project, then in each folder above it
 *  (hoisted in a workspace). "pnp" for Yarn Plug'n'Play, which has no
 *  node_modules. */
export const installedVersion = (root: string, name: string): string | "pnp" | null => {
  for (let dir = root; ; dir = dirname(dir)) {
    const found = readJson(join(dir, "node_modules", name, "package.json"))?.version;
    if (typeof found === "string") return found;
    if (existsSync(join(dir, ".pnp.cjs"))) return "pnp";
    if (dirname(dir) === dir) return null;
  }
};

const installedCore = (root: string) => installedVersion(root, "monochrome");

/** The files this CLI writes are its version's; the core the project runs
 *  must be that version too. Anything else stops before a file is written:
 *  an older core with the upgrade and where its steps are, a newer one
 *  with the project's own CLI. */
const requireCore = (project: Project, manager: Manager) => {
  const installed = installedCore(project.root);
  if (installed !== null && installed !== "pnp" && installed !== version) {
    const [ours, theirs] = [parseVersion(version), parseVersion(installed)];
    const newer = ours && theirs && compareVersions(theirs, ours) > 0;
    throw new Problem(
      `this project has monochrome@${installed}, but this is the monochrome@${version} CLI`,
      newer
        ? `Run the project's own CLI instead: npx monochrome (it is monochrome@${installed}).`
        : `Upgrade the project first: ${installCommand(project.root, manager, [`monochrome@${version}`])}\nWhat changed, and the steps to upgrade: npx monochrome@${version} changelog --from ${installed}`,
    );
  }
  if (installed === null && project.deps.has("monochrome")) {
    throw new Problem(
      "monochrome is in package.json but not installed",
      `Run ${manager} install, then run this again.`,
    );
  }
  return installed;
};

/** What the project lacks: monochrome at this CLI's version. Stops on
 *  a core at another version, before anything is written. */
export const missingPackages = (project: Project): string[] => {
  const installed = requireCore(project, detectManager(project.root).name);
  return installed !== null && project.deps.has("monochrome") ? [] : [`monochrome@${version}`];
};

/** The command that installs these packages, as the project runs it. */
export const installLine = (project: Project, packages: string[]) =>
  installCommand(project.root, detectManager(project.root).name, packages);

/** Installs `missing` (from `missingPackages`). Returns it. */
export const ensureInstalled = (project: Project, missing: string[]): string[] => {
  const command = installLine(project, missing);
  note(`${err.dim("installing")} ${command}`);
  // A shell finds npm.cmd on Windows, and every word is a known name or
  // version. Output goes to stderr, so stdout stays the result.
  // NODE_ENV=development keeps pnpm installing devDependencies.
  const result = spawnSync(command, {
    cwd: project.root,
    env: { ...process.env, NODE_ENV: "development" },
    shell: true,
    stdio: ["ignore", 2, 2],
  });
  if (result.error || result.status !== 0) {
    throw new Problem(
      `${command} failed${result.error ? ` (${result.error.message})` : ""}`,
      "Nothing was written. Fix the install, or run it yourself, then run this again.",
    );
  }
  const now = installedCore(project.root);
  if (now !== version && now !== "pnp") {
    throw new Problem(
      `${command} finished, but the project resolves ${now ? `monochrome@${now}` : "no monochrome"}`,
      `Install monochrome@${version} into ${project.root}, then run this again.`,
    );
  }
  return missing;
};
