import {
  findAncestor,
  getTarget,
  hasDocument,
  isElement,
  isTrigger,
  type RovingFocusCallback,
  roving,
  suppressedClicks,
  toggleDisclosure,
} from "./dom.js";

enum Prefix {
  RootAccordion = "mcr:accordion:",
  TriggerAccordion = "mct:accordion:",
}

if (hasDocument) {
  let shouldPreventDefault = false;
  let rovingBoundary: Element | null = null;

  const accordionRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) return null;
      if (!rovingBoundary) rovingBoundary = node;
      const trigger = node.firstElementChild?.firstElementChild;
      if (isTrigger(trigger, Prefix.TriggerAccordion) && trigger.ariaDisabled !== "true") {
        shouldPreventDefault = true;
        trigger.focus();
        return trigger;
      }
    }
    return fallback(node);
  };
  const [accordionNext, accordionPrevious] = roving(accordionRoving);

  const accordion = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled === "true") return;
    if (trigger.ariaExpanded === "true") {
      toggleDisclosure(trigger);
    } else {
      const root = findAncestor(trigger, Prefix.RootAccordion);
      if (!root || root.getAttribute("data-mode") !== "single") {
        toggleDisclosure(trigger);
      } else {
        let item = root.firstElementChild;
        while (item) {
          const itemTrigger = item.firstElementChild?.firstElementChild;
          if (
            isElement(itemTrigger) &&
            (itemTrigger === trigger || itemTrigger.ariaExpanded === "true")
          ) {
            toggleDisclosure(itemTrigger);
          }
          item = item.nextElementSibling;
        }
      }
    }
  };

  addEventListener("click", (event: MouseEvent) => {
    if (suppressedClicks.has(event)) return;
    const trigger = findAncestor(getTarget(event), Prefix.TriggerAccordion);
    if (trigger) accordion(trigger);
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    shouldPreventDefault = false;
    rovingBoundary = null;
    const target = event.target;
    if (isTrigger(target, Prefix.TriggerAccordion)) {
      const item = target.parentElement?.parentElement;
      if (item) {
        const root = item.parentElement;
        switch (event.key) {
          case "ArrowDown":
            accordionNext(item);
            break;
          case "ArrowUp":
            accordionPrevious(item);
            break;
          case "Home":
            if (root) accordionRoving(root.firstElementChild, accordionNext);
            break;
          case "End":
            if (root) accordionRoving(root.lastElementChild, accordionPrevious);
            break;
        }
      }
    }
    if (shouldPreventDefault) event.preventDefault();
  });
}
