import { findAncestor, getTarget, hasDocument, suppressedClicks, toggleDisclosure } from "./dom.js";

enum Prefix {
  TriggerCollapsible = "mct:collapsible:",
}

if (hasDocument) {
  addEventListener("click", (event: MouseEvent) => {
    if (suppressedClicks.has(event)) return;
    const trigger = findAncestor(getTarget(event), Prefix.TriggerCollapsible);
    if (trigger && trigger.ariaDisabled !== "true") toggleDisclosure(trigger);
  });
}
