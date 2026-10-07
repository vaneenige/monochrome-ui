import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { components, root } from "./files.js";
import { resolveAlias } from "./spec.js";
import { err, note, out, pad, Problem, print } from "./ui.js";

const spec = join(root, "spec");

export const topics = () =>
  readdirSync(spec)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.slice(0, -3))
    .sort();

const read = (topic: string) => readFileSync(join(spec, `${topic}.md`), "utf8");

/** A page's one-line `description` from its frontmatter. */
const describe = (topic: string) => {
  const line = /^description:\s*(.+)$/m.exec(read(topic).split(/^---$/m)[1] || "")?.[1];
  return (line || "").replace(/^(["'])(.*)\1$/, "$2");
};

/** `npx monochrome docs [topic]`: a spec page as markdown on stdout, the
 *  contract for this version. Without a topic, the list of pages. */
export const runDocs = (typed: string[]) => {
  const [topic, extra] = typed;
  const all = topics();
  if (extra) {
    throw new Problem("docs prints one topic at a time", "Example: npx monochrome docs menu", 2);
  }
  if (topic) {
    const name = resolveAlias(topic);
    if (!all.includes(name)) {
      throw new Problem(`unknown topic "${topic}"`, `Topics: ${all.join(", ")}.`, 2);
    }
    print(read(name).trimEnd());
  } else {
    const width = Math.max(...all.map((name) => name.length)) + 2;
    const rows = (names: string[]) =>
      names.map((name) => `  ${pad(name, width)}${describe(name)}`).join("\n");
    const listed = components();
    print(`${out.bold("Components")}\n${rows(all.filter((name) => listed.includes(name)))}`);
    print(`\n${out.bold("Reference")}\n${rows(all.filter((name) => !listed.includes(name)))}`);
    note();
    note(err.dim("Print one with npx monochrome docs <topic>."));
  }
};
