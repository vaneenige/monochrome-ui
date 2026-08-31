import {
  findAncestor,
  getTarget,
  hasDocument,
  shouldSuppressClick,
  toggleDisclosure,
} from "./dom.js";

enum Prefix {
  TriggerCollapsible = "mct:collapsible:",
}

if (hasDocument) {
  addEventListener("click", (event: MouseEvent) => {
    if (shouldSuppressClick[0]) return;
    const trigger = findAncestor(getTarget(event), Prefix.TriggerCollapsible);
    if (trigger && trigger.ariaDisabled !== "true") toggleDisclosure(trigger);
  });
}
