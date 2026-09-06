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

  const accordionTrigger = (item: Element | null | undefined) => {
    let el = item?.firstElementChild;
    while (el && !isTrigger(el, Prefix.TriggerAccordion)) {
      el = el.firstElementChild;
    }
    return isTrigger(el, Prefix.TriggerAccordion) ? el : null;
  };

  const accordionItem = (el: HTMLElement | null | undefined) => {
    const root = el && findAncestor(el, Prefix.RootAccordion);
    if (!root) return null;
    while (el && el.parentElement !== root) el = el.parentElement;
    return el;
  };

  const accordionRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) {
        shouldPreventDefault = true;
        return null;
      }
      if (!rovingBoundary) rovingBoundary = node;
      const trigger = accordionTrigger(node);
      if (trigger && trigger.ariaDisabled !== "true") {
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
        if (root) {
          let item = root.firstElementChild;
          while (item) {
            const itemTrigger = accordionTrigger(item);
            if (itemTrigger && itemTrigger.ariaExpanded === "true") {
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
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (isTrigger(target, Prefix.TriggerAccordion)) {
      if (event.key.startsWith("Arrow")) shouldPreventDefault = true;
      const item = accordionItem(target);
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
