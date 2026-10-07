export type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null;

export type RovingFocusCallback = (
  node: Element | null | undefined,
  fallback: RovingNavigator,
) => HTMLElement | null;

export type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator];

export type Side = "top" | "right" | "bottom" | "left";

export const hasDocument = typeof document !== "undefined";

export const isElement = (el: unknown): el is HTMLElement => el instanceof HTMLElement;

export const isTrigger = (el: unknown, prefix: string): el is HTMLButtonElement =>
  el instanceof HTMLButtonElement && el.id.startsWith(prefix);

export const findAncestor = (el: HTMLElement | null, prefix: string) => {
  while (el && !el.id.startsWith(prefix)) el = el.parentElement;
  return el;
};

export const getControls = (el: HTMLElement) => getLinked(el, "aria-controls");

export const getLinked = (el: HTMLElement, attr: string) => {
  const id = el.getAttribute(attr);
  return id ? document.getElementById(id) : null;
};

export const getTarget = (event: Event): HTMLElement | null => {
  const node = event.target;
  return isElement(node) ? node : node instanceof Element ? node.parentElement : null;
};

export const position = (trigger: HTMLElement, content: HTMLElement | null, side: Side) => {
  if (content) {
    content.style.setProperty("--mc-available-height", "initial");
    content.removeAttribute("data-mc-x");
    content.removeAttribute("data-mc-y");
    const rect = trigger.getBoundingClientRect();
    const width = content.offsetWidth;
    const height = content.offsetHeight;
    content.style.setProperty("--mc-trigger-top", `${rect.top}px`);
    content.style.setProperty("--mc-trigger-right", `${rect.right}px`);
    content.style.setProperty("--mc-trigger-bottom", `${rect.bottom}px`);
    content.style.setProperty("--mc-trigger-left", `${rect.left}px`);
    content.style.setProperty("--mc-content-width", `${width}px`);
    content.style.setProperty("--mc-content-height", `${height}px`);
    const authored = content.getAttribute("data-mc-side");
    const preferred =
      authored === "top" || authored === "right" || authored === "bottom" || authored === "left"
        ? authored
        : side;
    if (preferred === "top" || preferred === "bottom") {
      const room = positionSide(
        content,
        "data-mc-y",
        rect.top,
        innerHeight - rect.bottom,
        height,
        "top",
        "bottom",
        preferred,
      );
      content.style.setProperty("--mc-available-height", `${room}px`);
    } else {
      positionSide(
        content,
        "data-mc-x",
        rect.left,
        innerWidth - rect.right,
        width,
        "left",
        "right",
        preferred,
      );
    }
  }
};

const positionSide = (
  content: HTMLElement,
  name: string,
  before: number,
  after: number,
  size: number,
  start: Side,
  end: Side,
  preferred: Side,
) => {
  const isStart =
    preferred === start ? before >= size || before >= after : after < size && before > after;
  content.setAttribute(name, isStart ? start : end);
  return isStart ? before : after;
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
  const content = getControls(trigger);
  if (content) {
    const willOpen = trigger.ariaExpanded !== "true";
    trigger.ariaExpanded = `${willOpen}`;
    content.hidden = !willOpen;
  }
};
