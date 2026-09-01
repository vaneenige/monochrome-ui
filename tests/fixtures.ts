import { test as base } from "@playwright/test";

export const test = base.extend<{ renderer: "html" | "react" | "vue" | "remix" }>({
  renderer: ["react", { option: true }],
});

export { expect } from "@playwright/test";
