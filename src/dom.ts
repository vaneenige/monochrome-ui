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

let viewActive = 0;
let viewGuarded = false;
let viewPending: ViewTransition | null = null;
let viewQueue: (() => void)[] | null = null;
let viewRunning = false;

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

export const toggleDisclosure = (trigger: HTMLElement) => {
  const content = getLinked(trigger, "aria-controls");
  if (content) {
    viewTransition(content, () => {
      const willOpen = trigger.ariaExpanded !== "true";
      trigger.ariaExpanded = `${willOpen}`;
      content.hidden = !willOpen;
    });
  }
};

const viewDone = () => {
  viewActive--;
};

const viewGuard = (event: Event) => {
  if (event.type !== "keydown" && viewActive && event.target === document.documentElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else if (viewQueue && event.type !== "pointermove") {
    viewPending?.skipTransition();
    viewRun(viewQueue);
  }
};

const viewRun = (queue: (() => void)[]) => {
  if (viewQueue === queue) viewQueue = null;
  viewRunning = true;
  for (const update of queue.splice(0)) {
    try {
      update();
    } catch (error) {
      reportError(error);
    }
  }
  viewRunning = false;
};

export const viewStart = (origin: HTMLElement | null) => {
  let el = origin;
  while (el && !el.hasAttribute("data-view-transition")) el = el.parentElement;
  const mode = el?.getAttribute("data-view-transition");
  const host = mode === Transition.Viewport ? document : mode === Transition.Element ? el : null;
  const start = host && "startViewTransition" in host ? host.startViewTransition : null;
  return typeof start === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches
    ? (update: () => void): unknown => start.call(host, update)
    : null;
};

export const viewTransition = (origin: HTMLElement | null, update: () => void) => {
  const start = viewRunning ? null : viewStart(origin);
  if (!start) update();
  else if (viewQueue) viewQueue.push(update);
  else {
    const queue = [update];
    if (!viewGuarded) {
      viewGuarded = true;
      for (const type of ["pointerdown", "pointerup", "click", "pointermove", "keydown"]) {
        addEventListener(type, viewGuard, true);
      }
    }
    viewPending = null;
    viewQueue = queue;
    try {
      const transition = start(() => viewRun(queue));
      if (transition instanceof ViewTransition) {
        viewActive++;
        viewPending = transition;
        void transition.ready.catch(() => {});
        void transition.finished.then(viewDone, viewDone);
      }
    } catch {
      viewRun(queue);
    }
  }
};
