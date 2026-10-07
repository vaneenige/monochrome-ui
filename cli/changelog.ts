import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./files.js";
import { installedVersion } from "./install.js";
import { loadProject } from "./project.js";
import { compareVersions, parseVersion, type Version, version } from "./spec.js";
import { err, note, Problem, print } from "./ui.js";

type Flags = { from: string | undefined; to: string | undefined };

/** One `## ` section of CHANGELOG.md. `version` is null for Unreleased,
 *  which sorts above every release. */
type Entry = { version: Version | null; lines: string[] };

/** The package's CHANGELOG.md, one entry per `## ` heading, newest
 *  first. A heading inside a code fence does not count; the text before
 *  the first heading is the file's own introduction. */
const entries = (): Entry[] => {
  const path = join(root, "CHANGELOG.md");
  if (!existsSync(path)) throw new Error("CHANGELOG.md is missing from the installed package");
  const list: Entry[] = [];
  let fenced = false;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    if (!fenced && line.startsWith("## ")) {
      list.push({ version: parseVersion(line.slice(3).split(" ")[0] || ""), lines: [line] });
    } else {
      list.at(-1)?.lines.push(line);
    }
  }
  return list;
};

const versionFlag = (name: string, text: string) => {
  const parsed = parseVersion(text);
  if (!parsed) {
    throw new Problem(
      `--${name} needs a version, not "${text}"`,
      `Example: --${name} ${version}`,
      2,
    );
  }
  return parsed;
};

/** Where the changelog starts when `--from` is not given: the version the
 *  project runs, when it is older than this CLI. */
const projectVersion = () => {
  const installed = installedVersion(loadProject(process.cwd()).root, "monochrome");
  const parsed = installed && parseVersion(installed);
  const ours = parseVersion(version);
  return parsed && ours && compareVersions(parsed, ours) < 0 ? parsed : null;
};

/** `npx monochrome changelog`: the entries after `--from` up to and
 *  including `--to`, as markdown on stdout, newest first. Without either,
 *  the entries since the project's own version, else the newest one. */
export const runChangelog = (flags: Flags) => {
  const to = flags.to === undefined ? null : versionFlag("to", flags.to);
  const from = flags.from === undefined ? projectVersion() : versionFlag("from", flags.from);
  const all = entries();
  const picked =
    from === null && to === null
      ? all.slice(0, 1)
      : all.filter((entry) =>
          entry.version === null
            ? to === null
            : (from === null || compareVersions(entry.version, from) > 0) &&
              (to === null || compareVersions(entry.version, to) <= 0),
        );
  if (!picked[0]) {
    const range = [from && `after ${from.join(".")}`, to && `up to ${to.join(".")}`];
    note(`No changes ${range.filter(Boolean).join(" ")} in the monochrome@${version} changelog.`);
    return;
  }
  if (flags.from === undefined && from) {
    note(err.dim(`Changes since monochrome@${from.join(".")}, the version this project has.`));
  }
  if (picked.some(({ lines }) => lines.includes("### Upgrade"))) {
    note(err.dim("Apply each Upgrade section in order, starting from the oldest version."));
  }
  print(picked.map(({ lines }) => lines.join("\n").trim()).join("\n\n"));
};
