import {
  findAncestor,
  getTarget,
  hasDocument,
  isElement,
  isTrigger,
  type RovingFocusCallback,
  roving,
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
      if (rovingBoundary === node) {
        shouldPreventDefault = true;
        return null;
      }
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
    if (trigger.ariaDisabled !== "true") {
      if (trigger.ariaExpanded !== "true") {
        const root = findAncestor(trigger, Prefix.RootAccordion);
        if (root?.getAttribute("data-mode") === "single") {
          let item = root.firstElementChild;
          while (item) {
            const itemTrigger = item.firstElementChild?.firstElementChild;
            if (isElement(itemTrigger) && itemTrigger.ariaExpanded === "true") {
              toggleDisclosure(itemTrigger);
            }
            item = item.nextElementSibling;
          }
        }
      }
      toggleDisclosure(trigger);
    }
  };

  addEventListener("click", (event: MouseEvent) => {
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
        switch (event.key) {
          case "ArrowDown":
            accordionNext(item);
            break;
          case "ArrowUp":
            accordionPrevious(item);
            break;
          case "Home":
            accordionRoving(item.parentElement?.firstElementChild, accordionNext);
            break;
          case "End":
            accordionRoving(item.parentElement?.lastElementChild, accordionPrevious);
            break;
        }
      }
    }
    if (shouldPreventDefault) event.preventDefault();
  });
}
