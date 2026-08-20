/**
 * @file Popover: one trigger, one `popover=manual` panel.
 * Registers its own listeners. Outside `pointerdown` dismisses so
 * a Menu (or anything else) opening on pointerdown closes this
 * popover without Popover naming that component.
 */
import {
  findAncestor,
  getLinked,
  getTarget,
  hasDocument,
  isElement,
  position,
  suppressedClicks,
} from "./dom.js";

/** ID prefixes this file dispatches on. */
enum Prefix {
  ContentPopover = "mcc:popover:",
  TriggerPopover = "mct:popover:",
}

if (hasDocument) {
  let popoverShown: HTMLElement | null = null;

  /** Show or hide the popover linked from this trigger. */
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

  // Outside pointerdown dismisses so another overlay opening on
  // pointerdown closes this popover without naming that overlay.
  addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.button !== 0 || !popoverShown) return;
    let el = getTarget(event);
    while (el) {
      const id = el.id;
      if (id.startsWith(Prefix.TriggerPopover) || id.startsWith(Prefix.ContentPopover)) return;
      el = el.parentElement;
    }
    popover(popoverShown, false);
  });

  addEventListener("click", (event: MouseEvent) => {
    if (suppressedClicks.has(event)) return;
    const start = getTarget(event);
    if (start) {
      let el: HTMLElement | null = start;
      while (el) {
        const id = el.id;
        if (id.startsWith(Prefix.TriggerPopover) && el.ariaDisabled !== "true") {
          const isOpen = el.ariaExpanded === "true";
          popover(el, !isOpen);
          if (isOpen) {
            el.focus();
          } else {
            getLinked(el, "aria-controls")?.focus();
          }
          break;
        }
        if (id.startsWith(Prefix.ContentPopover)) break;
        el = el.parentElement;
      }
      if (!el && popoverShown) popover(popoverShown, false);
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
