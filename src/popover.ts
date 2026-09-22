import {
  findAncestor,
  getLinked,
  getTarget,
  hasDocument,
  isElement,
  position,
  viewListen,
  viewTransition,
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
      viewTransition(content, () => {
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
      });
    }
  };

  viewListen();
  addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.button !== 0 || !popoverShown) return;
    const el = getTarget(event);
    if (!findAncestor(el, Prefix.TriggerPopover) && !findAncestor(el, Prefix.ContentPopover)) {
      popover(popoverShown, false);
    }
  });

  addEventListener("click", (event: MouseEvent) => {
    const trigger = findAncestor(getTarget(event), Prefix.TriggerPopover);
    if (trigger && trigger.ariaDisabled !== "true") {
      const content = getLinked(trigger, "aria-controls");
      const isOpen = trigger.ariaExpanded === "true";
      popover(trigger, !isOpen);
      viewTransition(content, () => {
        if (isOpen) trigger.focus();
        else content?.focus();
      });
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && popoverShown && !event.defaultPrevented) {
      const trigger = popoverShown;
      const content = getLinked(trigger, "aria-controls");
      let el = getTarget(event);
      while (el && el !== content && !el.popover) el = el.parentElement;
      if (el === content || !el) {
        popover(trigger, false);
        viewTransition(content, () => {
          trigger.focus();
        });
        event.preventDefault();
      }
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
    if (popoverShown) {
      const content = getLinked(popoverShown, "aria-controls");
      if (content) position(popoverShown, content);
    }
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
