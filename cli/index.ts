import { parseArgs } from "node:util";
import { runAdd } from "./add.js";
import { runChangelog } from "./changelog.js";
import { frameworkIds } from "./config.js";
import { runDocs, topics } from "./docs.js";
import { runInit } from "./init.js";
import { components } from "./files.js";
import { aliases, site, version } from "./spec.js";
import { fail, note, out, pad, Problem, print, useJson } from "./ui.js";

/** `npx monochrome`: parses argv and dispatches to `commands`. */

type Flags = Record<string, string | boolean | undefined>;

type Flag = {
  type: "boolean" | "string";
  /** What a string flag takes, as help shows it: `--from <version>`. */
  value?: string;
  /** One line in the command's help; `\n` continues it. */
  help: string;
};

type Command = {
  /** What follows the command name: `<component...>`. */
  args: string;
  /** One line in `npx monochrome help`. */
  summary: string;
  /** What `npx monochrome help <command>` shows above its options. */
  about: () => string;
  flags: Record<string, Flag>;
  run: (args: string[], flags: Flags) => unknown;
};

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/** Flags every command that changes the project takes. */
const writeFlags: Record<string, Flag> = {
  "dry-run": { type: "boolean", help: "show what would change; install and write nothing" },
  json: { type: "boolean", help: "print the result (or the error) as JSON on stdout" },
};

const frameworkFlag: Record<string, Flag> = {
  framework: {
    type: "string",
    value: "name",
    help: `${frameworkIds.join(", ")} (default: monochrome.json, else react or vue\nwhen the project depends on it, else html)`,
  },
};

const commands: Record<string, Command> = {
  init: {
    args: "",
    summary: "Set a project up: install monochrome, save settings, brief agents",
    about: () => `Installs monochrome at this version with the project's package manager,
saves the settings add uses in monochrome.json, and adds a short marked
block to AGENTS.md that points agents at the spec. Re-running replaces only
that block.

Any project works: with a package.json, the spec lands in
node_modules/monochrome/spec/; without one (server templates, plain HTML),
nothing is installed, pages load the core from a CDN, and the block points
at npx monochrome docs.`,
    flags: { ...frameworkFlag, ...writeFlags },
    run: (_, flags) =>
      runInit({
        dryRun: flags["dry-run"] === true,
        framework: text(flags.framework),
      }),
  },

  add: {
    args: "<component...>",
    summary: "Add components to the project",
    about: () => `Prints the markup to start from, or in React and Vue writes the parts into
the project, once, and prints an example. Installs monochrome when the
project has a package.json and lacks it. The project owns every file from
then on.

  html     prints the markup and the line that loads the core
  react    writes the parts (.tsx, or .jsx without a tsconfig)
  vue      writes the parts (single-file components, a folder each)

monochrome ships no CSS: style each component with the project's own
styles. Each component's spec (npx monochrome docs <component>, Styling)
lists the states to style and an example; menus, popovers, and tooltips
also need its Required CSS, which places them at their trigger.

Flags are saved in monochrome.json, so later runs use them too. Files that
already exist are kept.

Components: ${components().join(", ")}
Aliases: ${Object.entries(aliases)
      .map(([alias, name]) => `${alias} (${name})`)
      .join(", ")}`,
    flags: {
      ...frameworkFlag,
      components: {
        type: "string",
        value: "dir",
        help: "where React or Vue parts go (default: src/components/ui,\nor components/ui without a src/ folder)",
      },
      ...writeFlags,
    },
    run: (names, flags) =>
      runAdd(names, {
        components: text(flags.components),
        dryRun: flags["dry-run"] === true,
        framework: text(flags.framework),
      }),
  },

  docs: {
    args: "[topic]",
    summary: "Print a component's spec, or list every topic",
    about: () => `Prints a page of the spec as markdown: the markup contract, keyboard,
how to style it, and common mistakes for this version. Without a
topic, lists every page. The same files are in node_modules/monochrome/spec/.

Topics: ${topics().join(", ")}
Aliases: ${Object.keys(aliases).join(", ")}`,
    flags: {},
    run: (typed) => runDocs(typed),
  },

  changelog: {
    args: "",
    summary: "Print what changed, with the steps to upgrade",
    about: () => `Prints entries from the changelog as markdown, newest first. Each version
lists its Upgrade steps first, then Breaking, Added, Changed, Fixed, and
Removed. Without flags: the changes since the version the project has,
when that is older than this CLI, else the newest entry.`,
    flags: {
      from: {
        type: "string",
        value: "version",
        help: "the version you are on; prints what came after it",
      },
      to: {
        type: "string",
        value: "version",
        help: "the last version to print (default: this one)",
      },
    },
    run: (_, flags) => runChangelog({ from: text(flags.from), to: text(flags.to) }),
  },
};

const usageLine = (name: string, { args, flags }: Command) =>
  `npx monochrome ${name}${args ? ` ${args}` : ""}${Object.keys(flags)[0] ? " [options]" : ""}`;

const overview = () => {
  const rows: [string, string][] = [
    ...Object.entries(commands).map(([name, command]): [string, string] => [
      `${name}${command.args ? ` ${command.args}` : ""}`,
      command.summary,
    ]),
    ["help [command]", "Show help for a command"],
  ];
  const width = Math.max(...rows.map(([left]) => left.length)) + 2;
  return `${out.bold(`monochrome ${version}`)}  The framework-agnostic UI library for agents.

${out.bold("Usage")}
  npx monochrome <command> [options]

${out.bold("Commands")}
${rows.map(([left, right]) => `  ${pad(left, width)}${right}`).join("\n")}

${out.bold("Options")}
  -h, --help     Show help
  -v, --version  Show the version

${out.dim(`Docs: ${site}`)}`;
};

const page = (name: string, command: Command) => {
  const options = Object.entries(command.flags).map(([flag, { help, value }]) => {
    const label = `--${flag}${value ? ` <${value}>` : ""}`;
    return `  ${pad(label, 20)}${help.replaceAll("\n", `\n${" ".repeat(22)}`)}`;
  });
  return [
    `${out.bold("Usage")}\n  ${usageLine(name, command)}`,
    command.about(),
    options[0] ? `${out.bold("Options")}\n${options.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const find = (name: string) => (Object.hasOwn(commands, name) ? commands[name] : undefined);

const unknown = (name: string) =>
  new Problem(`unknown command "${name}"`, "Run npx monochrome help for the list of commands.", 2);

/** A command's arguments and flags. `--yes` is accepted everywhere and does
 *  nothing: no command asks a question, and agents pass it out of habit. */
const parse = (name: string, command: Command, argv: string[]) => {
  try {
    const { positionals, values } = parseArgs({
      args: argv,
      allowPositionals: command.args !== "",
      strict: true,
      options: {
        ...Object.fromEntries(
          Object.entries(command.flags).map(([flag, { type }]) => [flag, { type }]),
        ),
        help: { type: "boolean", short: "h" },
        yes: { type: "boolean", short: "y" },
      },
    });
    return { args: positionals, flags: values as Flags };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const usage = `Usage: ${usageLine(name, command)}`;
    if (message.startsWith("Unexpected argument")) {
      throw new Problem(`${name} takes no arguments`, usage, 2);
    }
    const missing = /^Option '(--[\w-]+)/.exec(message)?.[1];
    if (missing && /argument missing/.test(message)) {
      throw new Problem(`${missing} needs a value`, usage, 2);
    }
    const option = /^Unknown option '([^']+)'/.exec(message)?.[1];
    if (!option) throw new Problem(message, usage, 2);
    const flags = Object.keys(command.flags).map((flag) => `--${flag}`);
    throw new Problem(
      `unknown option ${option} for ${name}`,
      `${name} takes ${flags[0] ? flags.join(", ") : "no options"}. ${usage}`,
      2,
    );
  }
};

const main = async () => {
  const [name, ...argv] = process.argv.slice(2);
  if (name === "-v" || name === "--version" || name === "version") return print(version);
  if (!name || name === "-h" || name === "--help") return print(overview());
  if (name === "help") {
    const topic = argv[0];
    if (!topic || topic === "help") return print(overview());
    const command = find(topic);
    if (!command) throw unknown(topic);
    return print(page(topic, command));
  }
  const command = find(name);
  if (!command) throw unknown(name);
  // Before parsing, so a usage error is JSON too; help stays text.
  const help = argv.includes("--help") || argv.includes("-h");
  if (argv.includes("--json") && "json" in command.flags && !help) useJson();
  const { args, flags } = parse(name, command, argv);
  if (flags.help) return print(page(name, command));
  await command.run(args, flags);
};

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  fail(`monochrome needs Node 20 or newer; this is Node ${process.versions.node}`, undefined, 1);
} else {
  main().catch((error: unknown) => {
    if (error instanceof Problem) {
      fail(error.message, error.hint, error.code);
      return;
    }
    fail(
      error instanceof Error ? error.message : String(error),
      "This is a bug in monochrome. Please report it: https://github.com/vaneenige/monochrome-ui/issues",
      1,
    );
    if (process.env.DEBUG && error instanceof Error && error.stack) note(error.stack);
  });
}
