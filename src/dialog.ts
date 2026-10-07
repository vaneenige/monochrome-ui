import { findAncestor, getControls, getLinked, getTarget, hasDocument, isElement } from "./dom.js";

enum Prefix {
  TriggerDialogClose = "mct:dialog-close:",
  TriggerDialogOpen = "mct:dialog-open:",
}

if (hasDocument) {
  let dialogContent: HTMLDialogElement | null = null;
  let dialogTrigger: HTMLElement | null = null;

  const dialogClose = () => {
    if (dialogContent?.open && dialogTrigger) {
      dialogContent.close();
      if (document.activeElement !== dialogTrigger) dialogTrigger.focus();
    }
  };

  const dialogOpen = (trigger: HTMLElement) => {
    const content = getControls(trigger);
    if (
      !(dialogContent?.open && dialogContent.isConnected) &&
      content instanceof HTMLDialogElement
    ) {
      dialogContent = content;
      dialogTrigger = trigger;
      trigger.focus({ preventScroll: true });
      content.showModal();
      const focused = document.activeElement;
      if (!isElement(focused) || !focused.autofocus) {
        (getLinked(content, "data-mc-autofocus") || content).focus();
      }
    }
  };

  addEventListener("click", (event: MouseEvent) => {
    const target = getTarget(event);
    if (findAncestor(target, Prefix.TriggerDialogClose)) dialogClose();
    else {
      const trigger = findAncestor(target, Prefix.TriggerDialogOpen);
      if (trigger && trigger.ariaDisabled !== "true") dialogOpen(trigger);
    }
  });
}
