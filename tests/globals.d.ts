// Test-only globals stashed on `window` by tests that need to observe
// state across navigations, reloads, or route boundaries. Declaring
// them here lets the tests read/write via `window.__sentinel` directly
// instead of casting through `unknown`.
interface Window {
  __sentinel?: number
  __navCount?: number
}

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent
  export default component
}
