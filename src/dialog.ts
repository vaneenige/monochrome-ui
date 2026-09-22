import {
  findAncestor,
  getLinked,
  getTarget,
  hasDocument,
  viewStart,
  viewTransition,
} from "./dom.js";

enum Prefix {
  ContentDialog = "mcc:dialog:",
  TriggerDialogClose = "mct:dialog-close:",
  TriggerDialogOpen = "mct:dialog-open:",
}

if (hasDocument) {
  let dialogContent: HTMLDialogElement | null = null;
  let dialogTrigger: HTMLElement | null = null;

  const dialogCancel = (event: Event) => {
    if (!event.defaultPrevented && event.target === dialogContent) {
      event.preventDefault();
      dialogClose(null);
    }
  };

  const dialogClose = (value: string | null) => {
    if (!dialogContent?.open || !dialogTrigger) return;
    const content = dialogContent;
    const trigger = dialogTrigger;
    dialogContent = null;
    dialogTrigger = null;
    viewTransition(content, () => {
      if (value === null) content.close();
      else content.close(value);
      if (document.activeElement !== trigger) trigger.focus();
    });
  };

  const dialogOpen = (trigger: HTMLElement) => {
    const content = getLinked(trigger, "aria-controls");
    if (!dialogContent?.open && content instanceof HTMLDialogElement) {
      viewTransition(content, () => {
        if (!dialogContent?.open) {
          dialogContent = content;
          dialogTrigger = trigger;
          content.showModal();
        }
      });
    }
  };

  addEventListener("click", (event: MouseEvent) => {
    const target = getTarget(event);
    if (findAncestor(target, Prefix.TriggerDialogClose)) dialogClose(null);
    else {
      const trigger = findAncestor(target, Prefix.TriggerDialogOpen);
      if (trigger && trigger.ariaDisabled !== "true") dialogOpen(trigger);
    }
  });

  addEventListener(
    "cancel",
    (event) => {
      const content = event.target;
      if (
        content instanceof HTMLDialogElement &&
        content === dialogContent &&
        event.cancelable &&
        viewStart(content)
      ) {
        content.addEventListener("cancel", dialogCancel, { once: true });
      }
    },
    true,
  );

  addEventListener("submit", (event: SubmitEvent) => {
    const form = event.target;
    const submitter = event.submitter;
    if (
      form instanceof HTMLFormElement &&
      dialogContent &&
      !event.defaultPrevented &&
      findAncestor(form, Prefix.ContentDialog) === dialogContent &&
      viewStart(dialogContent)
    ) {
      const isButton =
        submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement;
      if (((isButton && submitter.formMethod) || form.method) === "dialog") {
        event.preventDefault();
        dialogClose(isButton ? submitter.getAttribute("value") : null);
      }
    }
  });
}
