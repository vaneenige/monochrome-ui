import { readFileSync } from "node:fs";
import { join } from "node:path";
import { components, root } from "./files.js";
import type { Project } from "./project.js";
import { Problem } from "./ui.js";

/** What people call these, mapped onto the component that builds them. */
export const aliases: Record<string, string> = {
  "context-menu": "menu",
  details: "collapsible",
  disclosure: "collapsible",
  dropdown: "menu",
  "dropdown-menu": "menu",
  modal: "dialog",
  tab: "tabs",
};

/** A name as typed, lowercased and through the aliases. */
export const resolveAlias = (name: string) => {
  const lower = name.toLowerCase();
  return (Object.hasOwn(aliases, lower) && aliases[lower]) || lower;
};

/** Component names as typed, resolved and deduplicated. An unknown one
 *  is a usage error that lists what exists. */
export const componentNames = (typed: string[]) => {
  const names = [...new Set(typed.map(resolveAlias))];
  const unknown = names.filter((name) => !components().includes(name));
  if (unknown[0]) {
    throw new Problem(
      `unknown component ${unknown.map((name) => `"${name}"`).join(", ")}`,
      `Components: ${components().join(", ")}. Also: ${Object.keys(aliases).join(", ")}.`,
      2,
    );
  }
  return names;
};

export const site = "https://monochrome-ui.com";

export const specPath = (topic: string) => `node_modules/monochrome/spec/${topic}.md`;

/** The command that prints a spec page, for a project without
 *  node_modules: pinned, so it prints this version's contract. */
export const docsCommand = (topic: string) => `npx monochrome@${version} docs ${topic}`;

/** How a project runs this CLI: its installed one, or without
 *  node_modules this version, pinned to the core its pages load. */
export const npx = (project: Project) =>
  project.pkg ? "npx monochrome" : `npx monochrome@${version}`;

/** Where an agent reads a spec page in this project: the installed file,
 *  or the command that prints it when there is no package.json. */
export const specRef = (project: Project, topic: string) =>
  project.pkg ? specPath(topic) : docsCommand(topic);

const readVersion = (): string => {
  const pkg: unknown = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (pkg && typeof pkg === "object" && "version" in pkg && typeof pkg.version === "string") {
    return pkg.version;
  }
  throw new Error("package.json has no version in the installed package");
};

export const version = readVersion();

export type Version = [major: number, minor: number, patch: number];

/** A version as numbers (`v0.17` is 0.17.0), or null when the text is
 *  not one. A prerelease suffix is ignored. */
export const parseVersion = (text: string): Version | null => {
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-[\w.]+)?$/.exec(text.trim());
  return match ? [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)] : null;
};

/** Below zero when `a` is older than `b`, above when newer, else 0. */
export const compareVersions = (a: Version, b: Version) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
