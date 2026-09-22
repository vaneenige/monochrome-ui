export type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null;

export type RovingFocusCallback = (
  node: Element | null | undefined,
  fallback: RovingNavigator,
) => HTMLElement | null;

export type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator];

enum Transition {
  Element = "element",
  Viewport = "viewport",
}

export const hasDocument = typeof document !== "undefined";

export const isElement = (el: unknown): el is HTMLElement => el instanceof HTMLElement;

export const isTrigger = (el: unknown, prefix: string): el is HTMLButtonElement =>
  el instanceof HTMLButtonElement && el.id.startsWith(prefix);

export const findAncestor = (el: HTMLElement | null, prefix: string): HTMLElement | null => {
  while (el) {
    if (el.id.startsWith(prefix)) return el;
    el = el.parentElement;
  }
  return null;
};

export const getLinked = (el: HTMLElement, attr: string) => {
  const id = el.getAttribute(attr);
  return id ? document.getElementById(id) : null;
};

export const getTarget = (event: Event): HTMLElement | null => {
  const node = event.target;
  return isElement(node) ? node : node instanceof Element ? node.parentElement : null;
};

export const position = (trigger: HTMLElement, content: HTMLElement) => {
  const rect = trigger.getBoundingClientRect();
  content.style.setProperty("--top", `${rect.top}px`);
  content.style.setProperty("--right", `${rect.right}px`);
  content.style.setProperty("--bottom", `${rect.bottom}px`);
  content.style.setProperty("--left", `${rect.left}px`);
  content.style.setProperty("--width", `${content.offsetWidth}px`);
  content.style.setProperty("--height", `${content.offsetHeight}px`);
};

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

export const spatialKey = (key: string) =>
  document.dir === "rtl"
    ? key === "ArrowRight"
      ? "ArrowLeft"
      : key === "ArrowLeft"
        ? "ArrowRight"
        : key
    : key;

let viewQueue: (() => void)[] | null = null;
let viewRunning = false;

export const viewTransition = (origin: HTMLElement | null, update: () => void) => {
  if (viewRunning) {
    update();
    return false;
  }
  if (viewQueue) {
    viewQueue.push(update);
    return true;
  }
  let host: object | null = null;
  let el: HTMLElement | null = origin;
  while (el && !host) {
    const mode = el.getAttribute("data-view-transition");
    if (mode === Transition.Element) host = el;
    else if (mode === Transition.Viewport) host = document;
    else if (mode !== null) break;
    else el = el.parentElement;
  }
  let started = false;
  if (host && "startViewTransition" in host) {
    const start = host.startViewTransition;
    if (typeof start === "function") {
      const run = () => {
        viewRunning = true;
        const queued = viewQueue;
        try {
          while (queued?.[0]) {
            const fn = queued.shift();
            if (fn) fn();
          }
        } finally {
          viewQueue = null;
          viewRunning = false;
        }
      };
      viewQueue = [update];
      start.call(host, run);
      started = true;
    }
  }
  if (!started) update();
  return started && viewQueue !== null;
};

export const toggleDisclosure = (trigger: HTMLElement) => {
  const content = getLinked(trigger, "aria-controls");
  if (content) {
    const willOpen = trigger.ariaExpanded !== "true";
    const deferred = viewTransition(content, () => {
      trigger.ariaExpanded = `${willOpen}`;
      content.hidden = !willOpen;
    });
    if (deferred) trigger.ariaExpanded = `${willOpen}`;
  }
};
