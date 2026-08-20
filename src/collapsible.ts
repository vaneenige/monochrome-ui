/**
 * @file Collapsible: one trigger, one panel. Registers its own
 * `click` listener. The ARIA write lives in `toggleDisclosure`.
 */
import { findAncestor, getTarget, hasDocument, suppressedClicks, toggleDisclosure } from "./dom.js";

/** ID prefixes this file dispatches on. */
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
