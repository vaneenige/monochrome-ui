import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { format } from "oxfmt";
import ts from "typescript-api";

/** The files `npx monochrome add` copies, built into `dist/files/`:
 *  the manifest, the React parts (with .jsx twins), the Vue parts, and
 *  the examples add prints. The CLI copies them as they are. */

/** A component in templates/manifest.json (see its $comment). */
type Entry = { requires: string[]; placement?: boolean; files: Record<string, string[]> };

const out = "dist/files";

const components: Record<string, Entry> = JSON.parse(
  readFileSync("templates/manifest.json", "utf8"),
).components;

/** The first `lang` fence under the `## heading` of spec/<topic>.md. A
 *  heading inside a code fence does not count; `###` headings stay
 *  inside their `##` section. */
const specFence = (topic: string, heading: string, lang: string) => {
  let fenced = false;
  let current = "";
  const body: string[] = [];
  for (const line of readFileSync(`spec/${topic}.md`, "utf8").split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    if (!fenced && line.startsWith("## ")) current = line.slice(3).trim();
    else if (current === heading) body.push(line);
  }
  const code = new RegExp(`\`\`\`${lang}\\n([\\s\\S]*?)\`\`\``).exec(body.join("\n"))?.[1];
  if (code === undefined) {
    throw new Error(`spec/${topic}.md has no ${lang} fence under "${heading}"`);
  }
  return code;
};

/** The first line of every file a project gets: the version it came
 *  from, its name, and that it is the project's. A `.vue` file takes it
 *  as an HTML comment. */
const header = (file: string, version: string) => {
  const line = `monochrome@${version} ${file}: yours to edit.`;
  return file.endsWith(".vue") ? `<!-- ${line} -->\n` : `// ${line}\n`;
};

/** TSX with its TypeScript cut out: annotations, type arguments and
 *  parameters, casts, and type-only imports and declarations (with their
 *  doc comments). Everything else, comments included, stays as written. */
const withoutTypes = (tsx: string) => {
  const file = ts.createSourceFile("file.tsx", tsx, ts.ScriptTarget.Latest, true);
  const cuts: [start: number, end: number][] = [];
  /** `<…>` around type arguments or parameters. */
  const angled = (list: ts.NodeArray<ts.Node> | undefined) => {
    if (list) cuts.push([list.pos - 1, tsx.indexOf(">", list.end) + 1]);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isTypeNode(node) || ts.isTypeParameterDeclaration(node)) return;
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      cuts.push([node.getStart(file, true), node.end]);
      return;
    }
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const named =
        clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
          ? clause.namedBindings.elements
          : undefined;
      if (clause?.isTypeOnly || (!clause?.name && named?.every((item) => item.isTypeOnly))) {
        cuts.push([node.getStart(file), node.end]);
      } else {
        // A type specifier goes with the comma after it.
        for (const [i, item] of named?.entries() ?? []) {
          if (item.isTypeOnly) {
            cuts.push([item.getStart(file), named?.[i + 1]?.getStart(file) ?? item.end]);
          }
        }
      }
      return;
    }
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
      cuts.push([node.expression.end, node.end]);
    } else if (ts.isNonNullExpression(node)) {
      cuts.push([node.end - 1, node.end]);
    } else if (
      ts.isCallExpression(node) ||
      ts.isNewExpression(node) ||
      ts.isTaggedTemplateExpression(node) ||
      ts.isJsxOpeningLikeElement(node)
    ) {
      angled(node.typeArguments);
    } else if (ts.isParameter(node) || ts.isVariableDeclaration(node) || ts.isFunctionLike(node)) {
      if (ts.isParameter(node) && node.questionToken) {
        cuts.push([node.questionToken.getStart(file), node.questionToken.end]);
      }
      if (ts.isFunctionLike(node)) angled(node.typeParameters);
      if (node.type) cuts.push([node.type.pos - 1, node.type.end]);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  let js = "";
  let at = 0;
  for (const [start, end] of cuts.sort(([a], [b]) => a - b)) {
    js += tsx.slice(at, start);
    at = end;
  }
  return js + tsx.slice(at);
};

/** Code as oxfmt formats it. oxfmt parses by the file's extension, so a
 *  parse error fails the build. */
const formatted = async (file: string, code: string) => {
  const result = await format(file, code);
  if (result.errors[0]) throw new Error(`${file}: ${result.errors[0].message}`);
  return result.code;
};

/** The JavaScript twin of a TSX file, formatted as if written that way,
 *  naming its sibling files `.jsx` as the project does. It is parsed as
 *  JavaScript, so TypeScript that `withoutTypes` missed fails the build. */
const toJsx = (tsx: string, file: string) =>
  formatted(file, withoutTypes(tsx).replace(/\b(\w+)\.tsx\b/g, "$1.jsx"));

const write = (path: string, content: string) => {
  const full = join(out, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
};

const buildReact = async (name: string, files: string[], version: string) => {
  for (const file of files) {
    const source = readFileSync(`templates/react/${file}`, "utf8");
    const js = file.replace(/\.tsx$/, ".jsx");
    write(`react/${file}`, header(file, version) + source);
    write(`react/${js}`, header(js, version) + (await toJsx(source, js)));
  }
  const example = readFileSync(`templates/react/examples/${name}.tsx`, "utf8");
  write(`examples/${name}.tsx`, example);
  write(`examples/${name}.jsx`, await toJsx(example, `${name}.jsx`));
};

const buildVue = (name: string, files: string[], version: string) => {
  for (const file of files) {
    write(`vue/${file}`, header(file, version) + readFileSync(`templates/vue/${file}`, "utf8"));
  }
  write(`examples/${name}.vue`, readFileSync(`templates/vue/examples/${name}.vue`, "utf8"));
};

export const buildFiles = async (version: string) => {
  for (const [name, { files, placement }] of Object.entries(components)) {
    // `add` tells a project to copy the Required CSS when the manifest
    // says there is some, so the two never disagree.
    const required = /^### Required$/m.test(readFileSync(`spec/${name}.md`, "utf8"));
    if (required !== (placement === true)) {
      throw new Error(
        `templates/manifest.json: ${name} "placement" must be ${required}, as spec/${name}.md has${required ? "" : " no"} Required CSS`,
      );
    }
    for (const [framework, list] of Object.entries(files)) {
      if (framework === "react") await buildReact(name, list, version);
      else if (framework === "vue") buildVue(name, list, version);
      else
        throw new Error(
          `templates/manifest.json: ${name} lists files for "${framework}", which nothing builds`,
        );
    }
    // The markup is the example every framework without parts prints.
    write(`examples/${name}.html`, specFence(name, "Anatomy", "html"));
  }
  write("manifest.json", `${JSON.stringify({ components }, null, 2)}\n`);
};
