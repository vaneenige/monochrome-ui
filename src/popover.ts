import {
  findAncestor,
  getLinked,
  getTarget,
  hasDocument,
  isElement,
  position,
  shouldSuppressClick,
} from "./dom.js";

enum Prefix {
  ContentPopover = "mcc:popover:",
  TriggerPopover = "mct:popover:",
}

if (hasDocument) {
  let popoverShown: HTMLElement | null = null;

  const popover = (trigger: HTMLElement, show: boolean) => {
    if ((trigger.ariaExpanded === "true") === show) return;
    const content = getLinked(trigger, "aria-controls");
    if (content) {
      if (show) {
        if (popoverShown && popoverShown !== trigger) popover(popoverShown, false);
        content.showPopover();
        position(trigger, content);
        popoverShown = trigger;
      } else {
        content.hidePopover();
        if (popoverShown === trigger) popoverShown = null;
      }
      trigger.ariaExpanded = `${show}`;
      content.ariaHidden = `${!show}`;
    }
  };

  addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.button !== 0 || !popoverShown) return;
    const el = getTarget(event);
    if (!findAncestor(el, Prefix.TriggerPopover) && !findAncestor(el, Prefix.ContentPopover)) {
      popover(popoverShown, false);
    }
  });

  addEventListener("click", (event: MouseEvent) => {
    if (shouldSuppressClick[0]) return;
    const start = getTarget(event);
    if (start && !findAncestor(start, Prefix.ContentPopover)) {
      const trigger = findAncestor(start, Prefix.TriggerPopover);
      if (trigger && trigger.ariaDisabled !== "true") {
        const isOpen = trigger.ariaExpanded === "true";
        popover(trigger, !isOpen);
        if (isOpen) {
          trigger.focus();
        } else {
          getLinked(trigger, "aria-controls")?.focus();
        }
      } else if (popoverShown) popover(popoverShown, false);
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && popoverShown) {
      const trigger = popoverShown;
      popover(trigger, false);
      trigger.focus();
      event.preventDefault();
    }
  });

  addEventListener(
    "scroll",
    (event) => {
      if (
        popoverShown &&
        !(isElement(event.target) && findAncestor(event.target, Prefix.ContentPopover))
      ) {
        popover(popoverShown, false);
      }
    },
    true,
  );

  addEventListener("resize", () => {
    if (popoverShown) popover(popoverShown, false);
  });

  addEventListener("focusout", (event: FocusEvent) => {
    if (
      popoverShown &&
      isElement(event.relatedTarget) &&
      popoverShown !== event.relatedTarget &&
      !getLinked(popoverShown, "aria-controls")?.contains(event.relatedTarget)
    ) {
      popover(popoverShown, false);
    }
  });
}
