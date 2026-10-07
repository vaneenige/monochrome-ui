import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The installed package: package.json, spec/, and dist/files/, the
 *  prebuilt files `add` copies (built by scripts/files.ts). */
export const root = fileURLToPath(new URL("..", import.meta.url));

/** A prebuilt file, by its path in dist/files (`react/menu.tsx`). A
 *  missing one means a broken install, never a file to skip. */
const built = (source: string) => {
  const full = join(root, "dist/files", source);
  if (!existsSync(full)) {
    throw new Error(`dist/files/${source} is missing from the installed package`);
  }
  return readFileSync(full, "utf8");
};

export type File = { file: string; content: string };

/** templates/manifest.json (see its $comment). */
type Manifest = Record<
  string,
  { requires: string[]; placement?: boolean; files: Record<string, string[]> }
>;

let manifest: Manifest | null = null;
const listed = (): Manifest => (manifest ??= JSON.parse(built("manifest.json")).components);

export const components = () => Object.keys(listed());

/** These components and every one they require, each after the ones it
 *  requires. */
export const withRequirements = (names: string[]): string[] => {
  const ordered: string[] = [];
  const visit = (name: string) => {
    if (ordered.includes(name)) return;
    for (const needed of listed()[name]?.requires || []) visit(needed);
    ordered.push(name);
  };
  for (const name of names) visit(name);
  return ordered;
};

/** A component's React files, as TypeScript or JavaScript: `menu.tsx`,
 *  or `menu.jsx`. */
export const reactFiles = (name: string, ext: string): File[] =>
  (listed()[name]?.files.react || []).map((listedFile) => {
    const file = listedFile.replace(/\.tsx$/, `.${ext}`);
    return { file, content: built(`react/${file}`) };
  });

/** A component's Vue files: its folder of single-file components, with
 *  the `index.ts` that loads the core and names the parts. */
export const vueFiles = (name: string): File[] =>
  (listed()[name]?.files.vue || []).map((file) => ({ file, content: built(`vue/${file}`) }));

/** Whether a component needs its Required CSS (placement) to open at
 *  its trigger: menus, popovers, and tooltips. */
export const needsPlacement = (name: string) => listed()[name]?.placement === true;

/** The usage `add` prints: the spec's markup (`html`), or a React
 *  (`tsx`, `jsx`) or Vue (`vue`) component. */
export const example = (name: string, ext: string) => built(`examples/${name}.${ext}`);
