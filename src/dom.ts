export type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null;

export type RovingFocusCallback = (
  node: Element | null | undefined,
  fallback: RovingNavigator,
) => HTMLElement | null;

export type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator];

type ViewStart = [start: (update: () => void) => unknown, root: Element];

enum Transition {
  Element = "element",
  Viewport = "viewport",
}

export const hasDocument = typeof document !== "undefined";

const viewActive = new Map<ViewTransition, Element>();
let viewPending: ViewTransition | null = null;
let viewPressed = false;
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

const viewGuard = (event: Event) => {
  const target = event.target;
  let isHit = false;
  if (event instanceof MouseEvent && target instanceof Element) {
    for (const [transition, root] of viewActive) {
      if (target.contains(root)) {
        isHit = true;
        if (event.type === "pointerdown") transition.skipTransition();
      }
    }
  }
  if (isHit) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else if (event.type !== "pointermove") {
    viewPressed = event.type === "pointerdown";
    if (viewQueue) {
      viewPending?.skipTransition();
      viewRun(viewQueue);
    }
  }
};

export const viewListen = () => {
  for (const type of ["pointerdown", "pointerup", "click", "pointermove", "keydown"]) {
    addEventListener(type, viewGuard, true);
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

export const viewStart = (origin: HTMLElement | null): ViewStart | null => {
  let el = origin;
  while (el && !el.hasAttribute("data-view-transition")) el = el.parentElement;
  const mode = el?.getAttribute("data-view-transition");
  const host = mode === Transition.Viewport ? document : mode === Transition.Element ? el : null;
  const start = host && "startViewTransition" in host ? host.startViewTransition : null;
  return host &&
    typeof start === "function" &&
    !viewPressed &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
    ? [(update) => start.call(host, update), host instanceof Document ? host.documentElement : host]
    : null;
};

export const viewTransition = (origin: HTMLElement | null, update: () => void) => {
  const view = viewRunning ? null : viewStart(origin);
  if (!view) update();
  else if (viewQueue) viewQueue.push(update);
  else {
    const queue = [update];
    viewPending = null;
    viewQueue = queue;
    try {
      const transition = view[0](() => viewRun(queue));
      if (transition instanceof ViewTransition) {
        const done = () => {
          viewActive.delete(transition);
        };
        viewActive.set(transition, view[1]);
        viewPending = transition;
        void transition.ready.catch(() => {});
        void transition.finished.then(done, done);
      }
    } catch {
      viewRun(queue);
    }
  }
};
