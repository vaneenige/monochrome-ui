import type { FrameworkId } from "./config.js";
import { example, type File, reactFiles, vueFiles } from "./files.js";
import { installedVersion } from "./install.js";
import { type Project, workspaceApps } from "./project.js";
import { specRef } from "./spec.js";
import { Problem } from "./ui.js";

/** What `add` does, per framework: every framework gets an example; a
 *  framework with parts of its own (React, Vue) also gets those. */
export type Framework = {
  id: FrameworkId;
  /** Stops before anything is written when the project cannot take the
   *  files, with what to do instead. */
  check: (project: Project, component: string) => void;
  /** Its own files for a component. */
  files: (name: string, project: Project) => File[];
  /** The example `add` prints; `from` is how the project imports its
   *  components folder. */
  example: (name: string, project: Project, from: string) => { language: string; code: string };
  /** Whether a page loads the core itself. React and Vue parts import
   *  their own core module; markup needs `import "monochrome"` once. */
  loadsCore: boolean;
};

/** The version of `name` the project runs, as [major, minor]: the
 *  installed one, else the first version in the range its package.json
 *  asks for, else null. */
const runs = (project: Project, name: string): [number, number] | null => {
  const installed = installedVersion(project.root, name);
  const declared = ["dependencies", "devDependencies", "peerDependencies"]
    .map((field) => {
      const deps = project.pkg?.[field];
      return deps && typeof deps === "object" && name in deps
        ? (deps as Record<string, unknown>)[name]
        : undefined;
    })
    .find((range): range is string => typeof range === "string");
  const found = /(\d+)(?:\.(\d+))?/.exec(
    installed && installed !== "pnp" ? installed : declared || "",
  );
  return found ? [Number(found[1]), Number(found[2] ?? 0)] : null;
};

/** The React major the project runs, else null. */
export const reactMajor = (project: Project) => runs(project, "react")?.[0] ?? null;

const html: Framework = {
  id: "html",
  check: () => {},
  files: () => [],
  example: (name) => ({ language: "html", code: example(name, "html") }),
  loadsCore: true,
};

const react: Framework = {
  id: "react",
  check: (project, name) => {
    if (!project.deps.has("react")) {
      throw new Problem(
        "add writes React parts, and this project does not depend on react",
        "Install react 19 first, or run add with --framework html for the markup.",
      );
    }
    const major = reactMajor(project);
    if (major !== null && major < 19) {
      throw new Problem(
        `add writes React 19 components, and this project has React ${major}`,
        `Upgrade react and react-dom to 19 first, or run add with --framework html for the markup (${specRef(project, name)}): it works in any React version.`,
      );
    }
  },
  files: (name, project) => reactFiles(name, project.ext),
  example: (name, project, from) => {
    const code = example(name, project.ext).replaceAll("@/components/ui", from);
    // A Server Component cannot pass event handlers to the parts.
    const client = project.next && /\bon[A-Z]\w*=/.test(code);
    return { language: project.ext, code: client ? `"use client";\n\n${code}` : code };
  },
  loadsCore: false,
};

const vue: Framework = {
  id: "vue",
  check: (project, name) => {
    if (!project.deps.has("vue")) {
      throw new Problem(
        "add writes Vue parts, and this project does not depend on vue",
        "Install vue 3.5 first, or run add with --framework html for the markup.",
      );
    }
    const [major = 3, minor = 5] = runs(project, "vue") ?? [];
    if (major < 3 || (major === 3 && minor < 5)) {
      throw new Problem(
        `add writes Vue 3.5 components (they use useId), and this project has Vue ${major}.${minor}`,
        `Upgrade vue to 3.5 first, or run add with --framework html for the markup (${specRef(project, name)}): it works in any Vue version.`,
      );
    }
  },
  files: (name) => vueFiles(name),
  example: (name, _project, from) => ({
    language: "vue",
    code: example(name, "vue").replaceAll("@/components/ui", from),
  }),
  loadsCore: false,
};

export const frameworks: Record<FrameworkId, Framework> = { html, react, vue };

/** The framework a project without settings gets: React when it depends
 *  on react, Vue when it depends on vue, else markup. A workspace root
 *  is neither: its apps are where the files go. */
export const detectFramework = (project: Project): FrameworkId => {
  if (project.deps.has("react")) return "react";
  if (project.deps.has("vue")) return "vue";
  const apps = workspaceApps(project);
  if (apps?.[0]) {
    throw new Problem(
      "this is a workspace root; add writes into one app",
      `Run it in the app's folder: ${apps.join(", ")}. For markup here anyway, pass --framework html.`,
    );
  }
  return "html";
};
