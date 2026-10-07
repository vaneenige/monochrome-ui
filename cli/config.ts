import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import { Problem } from "./ui.js";

/** What `add` is for: plain markup (any stack: HTML, server templates,
 *  Astro, Svelte), printed, or React or Vue parts, written. */
export type FrameworkId = "html" | "react" | "vue";

export const frameworkIds: FrameworkId[] = ["html", "react", "vue"];

export const isFrameworkId = (value: unknown): value is FrameworkId =>
  frameworkIds.includes(value as FrameworkId);

/** What monochrome.json holds: the framework, and where its parts go,
 *  so every `add` writes the same way. */
export type Config = {
  framework: FrameworkId;
  paths: { components: string };
};

export const configFile = "monochrome.json";

/** A path with forward slashes and no trailing one, as monochrome.json
 *  stores it and `add` prints it, so both read the same on every OS. */
export const posix = (path: string) => path.split(sep).join("/").replace(/\/+$/, "") || ".";

const broken = (reason: string) =>
  new Problem(`${configFile} ${reason}`, "Fix it by hand; add never replaces a broken one.");

/** The saved settings, or null when there are none. A monochrome.json that
 *  does not parse is an error, never silently replaced. */
export const loadConfig = (root: string): Config | null => {
  const path = join(root, configFile);
  if (!existsSync(path)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw broken(`is not valid JSON (${error instanceof Error ? error.message : error})`);
  }
  const { framework, paths } = (parsed ?? {}) as Partial<Config>;
  if (!isFrameworkId(framework))
    throw broken(
      `needs "framework": ${frameworkIds
        .map((id) => `"${id}"`)
        .join(", ")
        .replace(/, (?=[^,]*$)/, ", or ")}`,
    );
  if (typeof paths?.components !== "string") {
    throw broken('needs "paths" with a "components" folder');
  }
  return { framework, paths: { components: posix(paths.components) } };
};

export const sameConfig = (a: Config, b: Config) =>
  a.framework === b.framework && a.paths.components === b.paths.components;

/** Write the settings in one rename, so a parallel `add` never reads half
 *  a file. */
export const saveConfig = (root: string, { framework, paths }: Config) => {
  const path = join(root, configFile);
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify({ framework, paths }, null, 2)}\n`);
  renameSync(temp, path);
};
