import { findAncestor, getControls, getTarget, hasDocument, isElement, position } from "./dom.js";

enum Prefix {
  ContentPopover = "mcc:popover:",
  TriggerPopover = "mct:popover:",
}

if (hasDocument) {
  let popoverShown: HTMLElement | null = null;

  const popover = (trigger: HTMLElement, show: boolean) => {
    if ((trigger.ariaExpanded === "true") === show) return;
    const content = getControls(trigger);
    if (content) {
      if (show) {
        if (popoverShown && popoverShown !== trigger) popover(popoverShown, false);
        content.showPopover();
        position(trigger, content, "bottom");
        popoverShown = trigger;
      } else {
        content.hidePopover();
      }
      trigger.ariaExpanded = `${show}`;
    }
    if (!show && popoverShown === trigger) popoverShown = null;
  };

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
      const isOpen = trigger.ariaExpanded === "true";
      popover(trigger, !isOpen);
      if (isOpen) {
        trigger.focus();
      } else {
        getControls(trigger)?.focus();
      }
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && popoverShown && !event.defaultPrevented) {
      const trigger = popoverShown;
      const content = getControls(trigger);
      let el = getTarget(event);
      while (el && el !== content && !el.popover && !(el instanceof HTMLDialogElement))
        el = el.parentElement;
      if (content && (el === content || !content.contains(el))) {
        popover(trigger, false);
        trigger.focus();
        event.preventDefault();
      }
    }
  });

  addEventListener(
    "scroll",
    (event) => {
      if (popoverShown && !findAncestor(getTarget(event), Prefix.ContentPopover)) {
        popover(popoverShown, false);
      }
    },
    true,
  );

  addEventListener("resize", () => {
    if (popoverShown) position(popoverShown, getControls(popoverShown), "bottom");
  });

  addEventListener("focusout", (event: FocusEvent) => {
    if (
      popoverShown &&
      isElement(event.relatedTarget) &&
      event.relatedTarget !== popoverShown &&
      !(event.relatedTarget.tabIndex < 0 && event.relatedTarget.contains(popoverShown)) &&
      !getControls(popoverShown)?.contains(event.relatedTarget)
    ) {
      popover(popoverShown, false);
    }
  });
}
