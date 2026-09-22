// Fails when a web API in src/ needs a newer Chrome, Safari, or
// Firefox than package.json browserslist allows. Types come from
// the TypeScript API, hosted on @typescript's libs: a name scan
// cannot tell sourceElement from navigation.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import bcd, { type Identifier } from "@mdn/browser-compat-data";
import ts from "typescript-api";

const engines = ["chrome", "safari", "firefox"] as const;
type Engine = (typeof engines)[number];

// Progressive enhancements (PRINCIPLES.md, north star 5): allowed
// above the floor only in the one file that feature-detects them,
// and only at the number of sites listed, so any new use fails
// until someone checks that it is guarded and bumps the count.
const enhancements = new Map<string, [file: string, sites: number]>([
  ["Document.startViewTransition", ["src/dom.ts", 1]],
  ["ViewTransition", ["src/dom.ts", 3]],
  ["ViewTransition.finished", ["src/dom.ts", 1]],
  ["ViewTransition.ready", ["src/dom.ts", 1]],
  ["ViewTransition.skipTransition", ["src/dom.ts", 2]],
]);
type Target = "core" | "router";
type Peak = { version: string; key: string } | null;

const rank = (value: string) =>
  value
    .replace("≤", "")
    .split(".")
    .map((part) => part.padStart(5, "0"))
    .join(".");

const version = (node: Identifier, engine: Engine) => {
  const support = node.__compat?.support[engine];
  const added = (Array.isArray(support) ? support[0] : support)?.version_added;
  if (typeof added !== "string") return null;
  const numeric = added.replace("≤", "");
  return /^\d/.test(numeric) ? numeric : null;
};

const filesIn = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") ? [path] : [];
  });

const floorsFor = (queries: string[] | undefined, target: Target) => {
  const floors = Object.fromEntries(
    (queries ?? []).flatMap((query) => {
      const match = /^(chrome|firefox|safari) >= ([\d.]+)$/.exec(query);
      return match?.[1] && match[2] ? [[match[1], match[2]]] : [];
    }),
  ) as Partial<Record<Engine, string>>;
  const parsed = {} as Record<Engine, string>;
  for (const engine of engines) {
    const floor = floors[engine];
    if (!floor) throw new Error(`browserslist ${target}: no usable ${engine} floor`);
    parsed[engine] = floor;
  }
  return parsed;
};

const inDom = (symbol: ts.Symbol) =>
  symbol.declarations?.some((declaration) =>
    declaration.getSourceFile().fileName.includes("lib.dom"),
  );

export const support = () => {
  const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile).config as unknown;
  const options = ts.parseJsonConfigFileContent(config, ts.sys, ".").options;
  const root = "node_modules/@typescript";
  const lib = readdirSync(root)
    .map((name) => join(root, name, "lib"))
    .find((path) => existsSync(join(path, "lib.dom.d.ts")));
  if (!lib) throw new Error(`No lib.dom.d.ts under ${root}`);
  const host = ts.createCompilerHost(options, true);
  host.getDefaultLibLocation = () => lib;
  host.getDefaultLibFileName = () => join(lib, "lib.esnext.full.d.ts");

  const files = filesIn("src");
  const program = ts.createProgram(files, options, host);
  const checker = program.getTypeChecker();
  const peaks: Record<Target, Record<Engine, Peak>> = {
    core: { chrome: null, safari: null, firefox: null },
    router: { chrome: null, safari: null, firefox: null },
  };

  let current = "";
  let site = -1;
  const sites = new Map<string, Set<number>>();
  const record = (target: Target, key: string, node: Identifier) => {
    const allowed = enhancements.get(key);
    if (allowed?.[0] === current) {
      const seen = sites.get(key) ?? new Set<number>();
      seen.add(site);
      sites.set(key, seen);
      if (seen.size <= allowed[1]) return;
    }
    for (const engine of engines) {
      const needs = version(node, engine);
      const peak = peaks[target][engine];
      if (needs && (!peak || rank(needs) > rank(peak.version)))
        peaks[target][engine] = { version: needs, key };
    }
  };

  const walk = (target: Target, type: ts.Type, member: string, seen: Set<ts.Type>): boolean => {
    const apparent = checker.getApparentType(type);
    if (seen.has(apparent)) return false;
    seen.add(apparent);
    if (apparent.isUnionOrIntersection()) {
      let found = false;
      for (const part of apparent.types) found = walk(target, part, member, seen) || found;
      return found;
    }
    const name = apparent.getSymbol()?.name;
    const entry = name ? bcd.api[name]?.[member] : undefined;
    if (entry?.__compat) {
      record(target, `${name}.${member}`, entry);
      return true;
    }
    if (apparent.isClassOrInterface()) {
      for (const base of checker.getBaseTypes(apparent)) {
        if (walk(target, base, member, seen)) return true;
      }
    }
    return false;
  };

  const fromSymbol = (target: Target, symbol: ts.Symbol) => {
    if (!inDom(symbol)) return;
    for (const declaration of symbol.declarations ?? []) {
      const parent = declaration.parent;
      if (ts.isInterfaceDeclaration(parent)) {
        const entry = bcd.api[parent.name.text]?.[symbol.name];
        if (entry?.__compat) record(target, `${parent.name.text}.${symbol.name}`, entry);
      } else {
        const entry = bcd.api[symbol.name];
        if (entry?.__compat) record(target, symbol.name, entry);
      }
    }
  };

  for (const file of program.getSourceFiles()) {
    current = file.fileName.replace(`${process.cwd()}/`, "");
    if (!files.includes(current)) continue;
    const target: Target = file.fileName.endsWith("src/router.ts") ? "router" : "core";
    const visit = (node: ts.Node) => {
      site = node.getStart(file);
      if (ts.isPropertyAccessExpression(node)) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (
          symbol &&
          inDom(symbol) &&
          !walk(target, checker.getTypeAtLocation(node.expression), symbol.name, new Set())
        ) {
          fromSymbol(target, symbol);
        }
      } else if (ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node.parent)) {
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol) fromSymbol(target, symbol);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  const pkg: { browserslist?: Record<string, string[] | undefined> } = JSON.parse(
    readFileSync("package.json", "utf8"),
  );
  const reaches: string[] = [];
  for (const target of ["core", "router"] as const) {
    const promised = floorsFor(pkg.browserslist?.[target], target);
    for (const engine of engines) {
      const peak = peaks[target][engine];
      if (peak && rank(peak.version) > rank(promised[engine])) {
        reaches.push(
          `${target}: ${peak.key} needs ${engine} ${peak.version}, declared ${promised[engine]}`,
        );
      }
    }
  }
  if (reaches[0]) throw new Error(reaches.join("\n"));
};

if (import.meta.main) support();
