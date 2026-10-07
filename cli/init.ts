import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { settle } from "./add.js";
import { configFile, loadConfig, sameConfig, saveConfig } from "./config.js";
import { reactMajor } from "./frameworks.js";
import { detectManager, ensureInstalled, installLine, missingPackages } from "./install.js";
import { loadProject, type Project, requireProject, workspaceApps } from "./project.js";
import { docsCommand, npx, specPath, version } from "./spec.js";
import { emit, err, note, out, pad, Problem, print } from "./ui.js";

export type InitFlags = {
  dryRun: boolean;
  framework: string | undefined;
};

const begin = "<!-- BEGIN:monochrome-agent-rules -->";
const end = "<!-- END:monochrome-agent-rules -->";

/** The AGENTS.md block. With node_modules, it points at the spec there;
 *  without a package.json, at the pinned command that prints it. */
const block = (project: Project) => {
  const installed = project.pkg !== null;
  const where = installed
    ? "The contract for the installed version is in `node_modules/monochrome/spec/`: one file per component, plus `choosing.md`, `conventions.md`, `styling.md`, and `router.md`. `npx monochrome docs <topic>` prints any of them."
    : `The contract for this version prints with \`${docsCommand("<topic>")}\`: one topic per component, plus \`choosing\`, \`conventions\`, \`styling\`, and \`router\`.`;
  const spec = (topic: string) =>
    installed ? `\`spec/${topic}.md\`` : `\`${docsCommand(topic)}\``;
  const cli = npx(project);
  return `${begin}

## monochrome: read the spec, not your memory

This project builds accordions, collapsibles, dialogs (modals), menus (dropdowns), menubars, popovers, tabs, and tooltips with monochrome, which is newer than your training data. The markup is the API: ARIA attributes are the state, and \`mct:\`/\`mcc:\`/\`mcr:\` ids wire the parts together. Never write JavaScript to open, close, or select one (item actions such as \`onClick\` are fine), and don't add another UI library for them.

${where}

1. Pick the component: ${spec("choosing")}.
2. Run \`${cli} add <component>\`. In React and Vue it writes the component's parts into this project once, with the settings in \`monochrome.json\`; it prints the markup or example to start from.
3. Place it. Keep every role and ARIA link; change text and props.
4. Style it with this project's own styles. monochrome ships no CSS: the component's spec (Styling) lists the states to style and an example, and menus, popovers, and tooltips need its Required CSS copied into the global CSS, or they open in the middle of the screen. How, with CSS, Tailwind, or StyleX: ${spec("styling")}.
5. Check the rendered HTML against the checklist in ${spec("conventions")} (Verify) and the component's Contract table and Common mistakes. After upgrading monochrome, run \`${cli} changelog --from <old version>\`, apply its Upgrade steps, and check again.

Written by \`npx monochrome init\`; content outside these markers is kept.

${end}`;
};

/** AGENTS.md with our block replaced, or appended, in the file's line
 *  endings. A lone marker means someone edited the block by hand: stop
 *  rather than guess which lines are theirs. */
const withBlock = (current: string | null, text: string) => {
  const from = current?.indexOf(begin) ?? -1;
  const to = current?.indexOf(end) ?? -1;
  if ((from === -1) !== (to === -1) || to < from) {
    throw new Problem(
      `AGENTS.md has only one of the ${begin} and ${end} markers`,
      "Restore or delete the other one, then run init again. Nothing was changed.",
    );
  }
  const eol = current?.includes("\r\n") ? "\r\n" : "\n";
  const body = text.replaceAll("\n", eol);
  if (current === null) return `${body}${eol}`;
  return from === -1
    ? `${current.trimEnd()}${eol}${eol}${body}${eol}`
    : current.slice(0, from) + body + current.slice(to + end.length);
};

/** Claude Code reads a project's CLAUDE.md instead of its AGENTS.md,
 *  unless the CLAUDE.md imports it (`@AGENTS.md`). */
const hidesAgents = (root: string) =>
  ["CLAUDE.md", ".claude/CLAUDE.md"].some((file) => {
    const path = join(root, file);
    return existsSync(path) && !readFileSync(path, "utf8").includes("AGENTS.md");
  });

export const runInit = (flags: InitFlags) => {
  const { dryRun } = flags;
  const project = loadProject(process.cwd());
  requireProject(project, version);
  const saved = loadConfig(project.root);
  // At a workspace root, settings belong to each app: add runs there.
  const apps =
    saved || flags.framework || project.deps.has("react") || project.deps.has("vue")
      ? null
      : workspaceApps(project);
  const config = apps?.[0]
    ? null
    : settle(project, saved, {
        components: undefined,
        framework: flags.framework,
      });
  // The block is checked before the install, so a broken AGENTS.md stops
  // init before anything changes.
  const agents = join(project.root, "AGENTS.md");
  const current = existsSync(agents) ? readFileSync(agents, "utf8") : null;
  const next = withBlock(current, block(project));
  const install = project.pkg ? missingPackages(project) : [];

  type Row = { change: "created" | "updated" | "unchanged"; path: string };
  const rows: Row[] = [];
  const installed = dryRun || !install[0] ? [] : ensureInstalled(project, install);
  if (next === current) {
    rows.push({ change: "unchanged", path: "AGENTS.md" });
  } else {
    if (!dryRun) writeFileSync(agents, next);
    rows.push({ change: current === null ? "created" : "updated", path: "AGENTS.md" });
  }
  if (config && (!saved || !sameConfig(saved, config))) {
    if (!dryRun) saveConfig(project.root, config);
    rows.push({ change: saved ? "updated" : "created", path: configFile });
  } else if (config) {
    rows.push({ change: "unchanged", path: configFile });
  }

  const old = config?.framework === "react" && (reactMajor(project) ?? 19) < 19;
  const nextSteps = [
    apps?.[0]
      ? `In an app's folder (${apps.join(", ")}): npx monochrome add menu`
      : `${npx(project)} add menu${old ? " --framework html" : ""}`,
    `Pick a component: ${project.pkg ? specPath("choosing") : docsCommand("choosing")}`,
  ];
  const warnings = hidesAgents(project.root)
    ? [
        "Claude Code reads CLAUDE.md instead of AGENTS.md here. Add a line with @AGENTS.md to CLAUDE.md so it sees the block.",
      ]
    : [];

  emit({
    dryRun,
    framework: config?.framework ?? null,
    install: install[0] ? { packages: install, command: installLine(project, install) } : null,
    installed,
    files: rows,
    warnings,
    next: nextSteps,
  });

  const row = (label: string, text: string, paint = out.green) =>
    print(`  ${paint(pad(label, 12))}${text}`);
  print(out.bold(`monochrome ${version} init${dryRun ? " (dry run: nothing changed)" : ""}`));
  if (project.pkg) {
    const manager = detectManager(project.root);
    row("manager", `${manager.name} ${out.dim(`(${manager.reason})`)}`, out.dim);
    if (install[0]) row(dryRun ? "install" : "installed", install.join(" "));
    else row("unchanged", `monochrome@${version} ${out.dim("(already installed)")}`, out.dim);
  } else {
    row(
      "no install",
      out.dim("no package.json: pages load the core from a CDN (add prints the tag)"),
      out.dim,
    );
  }
  for (const { change, path } of rows) {
    row(change, path, change === "unchanged" ? out.dim : out.green);
  }
  if (config) {
    print(out.dim(`  Framework: ${config.framework} (change with --framework).`));
  }
  for (const warning of warnings) note(`${err.yellow("note")} ${warning}`);
  print();
  print(out.bold("Next"));
  for (const step of nextSteps) print(`  ${step}`);
};
