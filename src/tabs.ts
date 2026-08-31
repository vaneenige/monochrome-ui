import {
  findAncestor,
  getLinked,
  getTarget,
  hasDocument,
  isElement,
  isTrigger,
  type RovingFocusCallback,
  roving,
  shouldSuppressClick,
  spatialKey,
} from "./dom.js";

enum Prefix {
  TriggerTabs = "mct:tabs:",
}

if (hasDocument) {
  let shouldPreventDefault = false;
  let rovingBoundary: Element | null = null;

  const tabsRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) {
        shouldPreventDefault = true;
        return null;
      }
      if (!rovingBoundary) rovingBoundary = node;
      if (isTrigger(node, Prefix.TriggerTabs) && node.ariaDisabled !== "true") {
        shouldPreventDefault = true;
        node.focus();
        return node;
      }
    }
    return fallback(node);
  };
  const [tabsNext, tabsPrevious] = roving(tabsRoving);

  const tabs = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled !== "true" && trigger.ariaSelected !== "true") {
      let tab = trigger.parentElement?.firstElementChild;
      while (tab) {
        if (isElement(tab) && (tab === trigger || tab.ariaSelected === "true")) {
          const content = getLinked(tab, "aria-controls");
          if (content) {
            const willSelect = tab === trigger;
            tab.ariaSelected = `${willSelect}`;
            tab.tabIndex = willSelect ? 0 : -1;
            content.ariaHidden = `${!willSelect}`;
            if (content.hasAttribute("tabindex")) content.tabIndex = willSelect ? 0 : -1;
            content.hidden = !willSelect;
          }
        }
        tab = tab.nextElementSibling;
      }
    }
  };

  addEventListener("click", (event: MouseEvent) => {
    if (shouldSuppressClick[0]) return;
    const trigger = findAncestor(getTarget(event), Prefix.TriggerTabs);
    if (trigger) tabs(trigger);
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    shouldPreventDefault = false;
    rovingBoundary = null;
    const target = event.target;
    if (isTrigger(target, Prefix.TriggerTabs)) {
      const vertical = target.parentElement?.ariaOrientation === "vertical";
      switch (spatialKey(event.key)) {
        case "ArrowDown":
          if (vertical) tabsNext(target);
          break;
        case "ArrowUp":
          if (vertical) tabsPrevious(target);
          break;
        case "ArrowRight":
          if (!vertical) tabsNext(target);
          break;
        case "ArrowLeft":
          if (!vertical) tabsPrevious(target);
          break;
        case "Home":
          tabsRoving(target.parentElement?.firstElementChild, tabsNext);
          break;
        case "End":
          tabsRoving(target.parentElement?.lastElementChild, tabsPrevious);
          break;
      }
    }
    if (shouldPreventDefault) event.preventDefault();
  });
}
