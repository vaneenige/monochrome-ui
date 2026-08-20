/**
 * @file Shared DOM helpers for every component.
 *
 * Components import this module and nothing else. Helpers import
 * nothing: no components, no router, no framework. Behaviour that
 * names another component does not belong here (Accordion's
 * single-mode sweep stays in `accordion.ts`; Menu's stack stays in
 * `menu.ts`).
 *
 * `toggleDisclosure` is the shared ARIA expand/collapse write.
 * Accordion uses it per item; Collapsible is that write plus a
 * click listener. Accordion does not import Collapsible, so the
 * Collapsible listeners are not registered twice.
 *
 * `suppressedClicks` is how a Menu pointer session claims the
 * trailing click without naming Collapsible (or anyone else).
 * The event is not stopped, so user listeners still fire.
 */

/** Sibling walker returned by `roving`: one step in one direction. */
export type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null;

/**
 * Per-node callback for `roving`. `fallback` continues the walk
 * when `node` is not a match (disabled, wrong role, typeahead
 * miss). Named `node` / `fallback` to match the type alias.
 */
export type RovingFocusCallback = (
  node: Element | null | undefined,
  fallback: RovingNavigator,
) => HTMLElement | null;

/** Build a `[next, previous]` pair that share one focus callback. */
export type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator];

/** Clicks claimed by a pointer session. WeakSet so the mark dies
 * with the event; no timer, no clear. Declared before
 * `hasDocument`: swapping the two costs combined gzip. */
export const suppressedClicks = new WeakSet<Event>();

/** False during SSR so listeners are not registered. */
export const hasDocument = typeof document !== "undefined";

/** Narrow `event.target` and walk cursors to `HTMLElement`. */
export const isElement = (el: unknown): el is HTMLElement => el instanceof HTMLElement;

/**
 * A button whose `id` starts with the component's trigger prefix.
 * Used at listener entry so the rest of the handler can read
 * `ariaDisabled` without a second check.
 */
export const isTrigger = (el: unknown, prefix: string): el is HTMLButtonElement =>
  el instanceof HTMLButtonElement && el.id.startsWith(prefix);

/**
 * Walk `parentElement` until `id` starts with `prefix`. Replaces
 * `closest()` so we never introduce classes or data attributes as
 * a shadow registry.
 */
export const findAncestor = (el: HTMLElement | null, prefix: string): HTMLElement | null => {
  while (el) {
    if (el.id.startsWith(prefix)) return el;
    el = el.parentElement;
  }
  return null;
};

/**
 * Resolve an IDREF attribute (`aria-controls`, `aria-labelledby`,
 * `aria-describedby`) to its element. `getElementById` is the one
 * ID lookup the core allows; there is no selector engine involved.
 */
export const getLinked = (el: HTMLElement, attr: string) => {
  const id = el.getAttribute(attr);
  return id ? document.getElementById(id) : null;
};

/**
 * Element that owns the event. Text nodes (a click on a label's
 * text) resolve to their parent element so prefix dispatch still
 * sees the trigger.
 */
export const getTarget = (event: Event): HTMLElement | null => {
  const node = event.target;
  return isElement(node) ? node : node instanceof Element ? node.parentElement : null;
};

/**
 * Publish the trigger rect (TRBL) and the content's own size as
 * CSS custom properties. Positioning is CSS; this is the only
 * layout read the core performs.
 */
export const position = (trigger: HTMLElement, content: HTMLElement) => {
  const rect = trigger.getBoundingClientRect();
  content.style.setProperty("--top", `${rect.top}px`);
  content.style.setProperty("--right", `${rect.right}px`);
  content.style.setProperty("--bottom", `${rect.bottom}px`);
  content.style.setProperty("--left", `${rect.left}px`);
  content.style.setProperty("--width", `${content.offsetWidth}px`);
  content.style.setProperty("--height", `${content.offsetHeight}px`);
};

/**
 * Wrap-around sibling walker. `next` uses `nextElementSibling`
 * (or the parent's first child); `previous` mirrors that. The
 * focus callback decides whether the candidate counts.
 */
export const roving: Roving = (focus) => {
  const next: RovingNavigator = (origin) =>
    origin
      ? focus(origin.nextElementSibling || origin.parentElement?.firstElementChild, next)
      : null;
  const previous: RovingNavigator = (origin) =>
    origin
      ? focus(origin.previousElementSibling || origin.parentElement?.lastElementChild, previous)
      : null;
  return [next, previous];
};

/**
 * Mirror ArrowLeft / ArrowRight when `document.dir` is `rtl`.
 * Spatial keys only; Home, End, Tab, and typeahead pass through.
 */
export const spatialKey = (key: string) =>
  document.dir === "rtl" && key === "ArrowRight"
    ? "ArrowLeft"
    : document.dir === "rtl" && key === "ArrowLeft"
      ? "ArrowRight"
      : key;

/**
 * Toggle `aria-expanded` on a trigger and `aria-hidden` / `hidden`
 * on its `aria-controls` content. Shared by Accordion and
 * Collapsible; not a component of its own.
 */
export const toggleDisclosure = (trigger: HTMLElement) => {
  const content = getLinked(trigger, "aria-controls");
  if (content) {
    const willOpen = trigger.ariaExpanded !== "true";
    trigger.ariaExpanded = `${willOpen}`;
    content.ariaHidden = `${!willOpen}`;
    content.hidden = !willOpen;
  }
};
