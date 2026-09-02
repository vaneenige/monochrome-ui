import { findAncestor, getLinked, getTarget, hasDocument, isTrigger, position } from "./dom.js";

enum Prefix {
  ContentTooltip = "mcc:tooltip:",
  TriggerTooltip = "mct:tooltip:",
}

if (hasDocument) {
  let pointerTarget: EventTarget | null = null;
  let tooltipFocused: HTMLElement | null = null;
  let tooltipHovered: HTMLElement | null = null;
  let tooltipShown: HTMLElement | null = null;
  let tooltipSuppressed: HTMLElement | null = null;

  const tooltip = (trigger: HTMLElement, show: boolean) => {
    const content = getLinked(trigger, "aria-describedby");
    if (content) {
      if (show) {
        content.showPopover();
        position(trigger, content);
      } else {
        content.hidePopover();
      }
    }
  };

  const tooltipReset = () => {
    tooltipFocused = null;
    tooltipHovered = null;
    tooltipSync();
  };

  const tooltipSuppress = () => {
    if (tooltipShown) {
      tooltipSuppressed = tooltipShown;
      tooltipSync();
    }
  };

  const tooltipSync = () => {
    if (
      tooltipSuppressed &&
      tooltipSuppressed !== tooltipHovered &&
      tooltipSuppressed !== tooltipFocused
    ) {
      tooltipSuppressed = null;
    }
    const active = tooltipHovered || tooltipFocused;
    const next = active && active !== tooltipSuppressed ? active : null;
    if (next !== tooltipShown) {
      if (tooltipShown) tooltip(tooltipShown, false);
      if (next) tooltip(next, true);
      tooltipShown = next;
    }
  };

  addEventListener("click", (event: MouseEvent) => {
    if (findAncestor(getTarget(event), Prefix.TriggerTooltip)) tooltipSuppress();
  });

  addEventListener("pointermove", (event: PointerEvent) => {
    if (event.pointerType === "touch" || event.target === pointerTarget) return;
    pointerTarget = event.target;
    const target = getTarget(event);
    if (target && !findAncestor(target, Prefix.ContentTooltip)) {
      const nextHover = findAncestor(target, Prefix.TriggerTooltip);
      if (nextHover !== tooltipHovered) {
        tooltipHovered = nextHover;
        tooltipSync();
      }
    }
  });

  addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && tooltipShown) {
        tooltipSuppress();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  addEventListener(
    "scroll",
    () => {
      if (tooltipShown) tooltipReset();
      pointerTarget = null;
    },
    true,
  );

  addEventListener("resize", () => {
    if (tooltipShown) tooltipReset();
    pointerTarget = null;
  });

  addEventListener("focusin", (event: FocusEvent) => {
    const target = event.target;
    if (isTrigger(target, Prefix.TriggerTooltip)) {
      if (tooltipFocused !== target) {
        tooltipFocused = target;
        tooltipSync();
      }
    } else if (tooltipFocused) {
      tooltipFocused = null;
      tooltipSync();
    }
  });

  addEventListener("focusout", (event: FocusEvent) => {
    if (tooltipFocused && event.target === tooltipFocused && !event.relatedTarget) {
      tooltipFocused = null;
      tooltipSync();
    }
  });
}
