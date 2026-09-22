import { findAncestor, getTarget, hasDocument, toggleDisclosure, viewListen } from "./dom.js";

enum Prefix {
  TriggerCollapsible = "mct:collapsible:",
}

if (hasDocument) {
  viewListen();
  addEventListener("click", (event: MouseEvent) => {
    const trigger = findAncestor(getTarget(event), Prefix.TriggerCollapsible);
    if (trigger && trigger.ariaDisabled !== "true") toggleDisclosure(trigger);
  });
}
