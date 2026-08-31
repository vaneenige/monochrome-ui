import { findAncestor, getLinked, getTarget, hasDocument, shouldSuppressClick } from "./dom.js";

enum Prefix {
  TriggerDialogClose = "mct:dialog-close:",
  TriggerDialogOpen = "mct:dialog-open:",
}

if (hasDocument) {
  let dialogContent: HTMLDialogElement | null = null;
  let dialogTrigger: HTMLElement | null = null;

  const dialogClose = () => {
    if (!dialogContent?.open || !dialogTrigger) return;
    const content = dialogContent;
    const trigger = dialogTrigger;
    dialogContent = null;
    dialogTrigger = null;
    content.close();
    trigger.focus();
  };

  const dialogOpen = (trigger: HTMLElement) => {
    const content = getLinked(trigger, "aria-controls");
    if (!dialogContent?.open && content instanceof HTMLDialogElement) {
      dialogContent = content;
      dialogTrigger = trigger;
      content.showModal();
    }
  };

  addEventListener("click", (event: MouseEvent) => {
    if (shouldSuppressClick[0]) return;
    const target = getTarget(event);
    if (findAncestor(target, Prefix.TriggerDialogClose)) dialogClose();
    else {
      const trigger = findAncestor(target, Prefix.TriggerDialogOpen);
      if (trigger && trigger.ariaDisabled !== "true") dialogOpen(trigger);
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && dialogContent) dialogClose();
  });
}
