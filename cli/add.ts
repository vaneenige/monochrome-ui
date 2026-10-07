import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  type Config,
  configFile,
  frameworkIds,
  isFrameworkId,
  loadConfig,
  posix,
  sameConfig,
  saveConfig,
} from "./config.js";
import { components, type File, needsPlacement, withRequirements } from "./files.js";
import { detectFramework, frameworks } from "./frameworks.js";
import { ensureInstalled, installLine, missingPackages } from "./install.js";
import {
  appEntry,
  defaultComponents,
  importBase,
  importFrom,
  type Load,
  loadProject,
  loads,
  type Project,
  requireProject,
} from "./project.js";
import { componentNames, specRef, version } from "./spec.js";
import { emit, err, note, pad, Problem, print } from "./ui.js";

export type AddFlags = {
  components: string | undefined;
  dryRun: boolean;
  framework: string | undefined;
};

type Row = { change: "created" | "kept" | "updated"; path: string };

/** Settings for this run: flags, else monochrome.json, else detected. A
 *  folder flag is relative to where the command runs, and saved relative
 *  to the project, so the next run uses it too. */
export const settle = (
  project: Project,
  saved: Config | null,
  flags: Omit<AddFlags, "dryRun">,
): Config => {
  if (flags.framework !== undefined && !isFrameworkId(flags.framework)) {
    throw new Problem(
      `unknown framework "${flags.framework}"`,
      `Use ${frameworkIds.join(" or ")}.`,
      2,
    );
  }
  const framework = isFrameworkId(flags.framework)
    ? flags.framework
    : (saved?.framework ?? detectFramework(project));
  return {
    framework,
    paths: {
      components:
        flags.components === undefined
          ? (saved?.paths.components ?? defaultComponents(project))
          : posix(relative(project.root, resolve(flags.components))),
    },
  };
};

/** "a file in src/", for the paths `add` prints relative to a folder. */
const inFolder = (folder: string) =>
  `a file in ${folder === "." ? "the project root" : `${folder}/`}`;

const nextSteps = (project: Project, config: Config, names: string[], placed: string[]) => [
  config.framework !== "html"
    ? "Place the parts where they belong. Keep their nesting; change text and props."
    : "Paste the markup where it belongs. Keep every role and aria-* link; change the text, and rename id suffixes together so each id stays unique on the page.",
  ...placed.map(
    (name) =>
      `Required: copy the Required CSS from ${specRef(project, name)} (Styling) into the project's global CSS, as it is. Without it, ${name}s open in the middle of the screen, not at their trigger.`,
  ),
  `Style it with the project's own styles: the states to style, and an example, are in ${names.map((name) => specRef(project, name)).join(", ")} (Styling). monochrome ships no CSS; ${specRef(project, "styling")} shows how with CSS, Tailwind, or StyleX.`,
  `Check the rendered HTML against ${specRef(project, "conventions")} (Verify).`,
];

export const runAdd = (typed: string[], flags: AddFlags) => {
  const names = componentNames(typed);
  const [first] = names;
  if (!first) {
    throw new Problem(
      "add needs at least one component",
      `Components: ${components().join(", ")}. Example: npx monochrome add menu`,
      2,
    );
  }
  const { dryRun } = flags;
  const project = loadProject(process.cwd());
  requireProject(project, version);
  const saved = loadConfig(project.root);
  const config = settle(project, saved, flags);
  const framework = frameworks[config.framework];
  framework.check(project, first);
  const { paths } = config;

  // Everything is read before anything is written or installed, so a
  // broken package never leaves a half-written project.
  const all = withRequirements(names);
  const alias = framework.loadsCore ? null : importBase(project, paths.components);
  const { folder } = appEntry(project);
  const from = alias || importFrom(project, folder, paths.components);
  const examples = names.map((name) => ({
    component: name,
    ...framework.example(name, project, from),
  }));
  const parts = all.flatMap((name) => framework.files(name, project));
  const placed = all.filter(needsPlacement);
  // A folder without a package.json loads the core from a CDN.
  const install = project.pkg ? missingPackages(project) : [];
  const installed = dryRun || !install[0] ? [] : ensureInstalled(project, install);

  const rows: Row[] = [];
  /** Write a file once: from then on it belongs to the project. */
  const write = (path: string, { content }: File) => {
    const full = resolve(project.root, path);
    if (existsSync(full)) {
      rows.push({ change: "kept", path });
      return;
    }
    if (!dryRun) {
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    rows.push({ change: "created", path });
  };
  for (const file of parts) write(posix(join(paths.components, file.file)), file);

  const changed = !saved || !sameConfig(saved, config);
  if (changed) {
    if (!dryRun) saveConfig(project.root, config);
    rows.push({ change: saved ? "updated" : "created", path: configFile });
  }

  const toLoad: Load[] = framework.loadsCore ? loads(project, { firstRun: !saved, version }) : [];
  const next = nextSteps(project, config, names, placed);

  emit({
    dryRun,
    framework: config.framework,
    install: install[0] ? { packages: install, command: installLine(project, install) } : null,
    installed,
    files: rows,
    load: toLoad.map(({ file, place, lines, afterwards }) => ({
      file,
      place,
      lines,
      afterwards: afterwards ?? null,
    })),
    examples,
    styling: {
      required: placed.map((name) => ({ component: name, spec: specRef(project, name) })),
      spec: specRef(project, "styling"),
    },
    next,
  });

  if (dryRun) {
    note(err.dim("Dry run: nothing was installed or written."));
    if (install[0]) note(`${err.dim(pad("install", 10))}${installLine(project, install)}`);
  }
  for (const row of rows) {
    const paint = row.change === "kept" ? err.dim : err.green;
    note(`${paint(pad(row.change, 10))}${row.path}`);
  }
  if (changed) {
    note(
      err.dim(
        `Settings in ${configFile}: ${config.framework}${parts[0] ? `, components in ${paths.components}/` : ""}.`,
      ),
    );
  }
  note();
  for (const [i, { code }] of examples.entries()) {
    if (names[1])
      print(`${i ? "\n" : ""}${framework.loadsCore ? `<!-- ${names[i]} -->` : `// ${names[i]}`}`);
    print(code.trimEnd());
  }
  note();

  if (!framework.loadsCore && !alias)
    note(`The example's import path works from ${inFolder(folder)}.`);
  for (const load of toLoad) {
    note(
      load.file
        ? `Load the core once, in ${load.file}:`
        : load.folder === "."
          ? `Load the core once, in ${load.place}:`
          : `Load the core once, in ${load.place} (the path works from ${inFolder(load.folder)}):`,
    );
    for (const line of load.lines) note(`  ${line}`);
    if (load.afterwards) note(load.afterwards);
  }
  note("Next:");
  for (const step of next) note(`  ${step}`);
};
