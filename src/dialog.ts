import { getLinked, getTarget, hasDocument, suppressedClicks } from "./dom.js";

enum Prefix {
  ContentDialog = "mcc:dialog:",
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
    if (suppressedClicks.has(event)) return;
    let el = getTarget(event);
    while (el) {
      const id = el.id;
      if (id.startsWith(Prefix.TriggerDialogClose)) {
        dialogClose();
        break;
      }
      if (id.startsWith(Prefix.TriggerDialogOpen) && el.ariaDisabled !== "true") {
        dialogOpen(el);
        break;
      }
      if (id.startsWith(Prefix.ContentDialog)) break;
      el = el.parentElement;
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && dialogContent) dialogClose();
  });
}
