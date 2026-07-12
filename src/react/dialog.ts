import { createContext, createElement, type ReactElement, useContext, useId } from "react";
import type { BaseProps } from "./shared.js";

type DialogContextValue = { id: string };
const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("Dialog components must be used within Dialog.Root");
  return context;
}

function Root({ children, ...props }: BaseProps): ReactElement {
  const id = useId();
  return createElement(
    DialogContext.Provider,
    { value: { id } },
    createElement("div", props, children),
  );
}

function Trigger({
  children,
  disabled,
  ...props
}: BaseProps & { disabled?: boolean }): ReactElement {
  const context = useDialogContext();
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:dialog-open:${context.id}`,
      "aria-haspopup": "dialog",
      "aria-controls": `mcc:dialog:${context.id}`,
      ...(disabled ? { "aria-disabled": "true" } : {}),
    },
    children,
  );
}

function Content({ children, ...props }: BaseProps): ReactElement {
  const context = useDialogContext();
  const hasLabel = "aria-label" in props;
  const hasDescription = "aria-description" in props;
  return createElement(
    "dialog",
    {
      ...(hasLabel ? {} : { "aria-labelledby": `mcc:dialog-title:${context.id}` }),
      ...(hasDescription ? {} : { "aria-describedby": `mcc:dialog-description:${context.id}` }),
      ...props,
      id: `mcc:dialog:${context.id}`,
      tabIndex: -1,
    },
    children,
  );
}

function Title({
  children,
  as,
  ...props
}: BaseProps & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}): ReactElement {
  const context = useDialogContext();
  return createElement(as ?? "h2", { ...props, id: `mcc:dialog-title:${context.id}` }, children);
}

function Description({ children, ...props }: BaseProps): ReactElement {
  const context = useDialogContext();
  return createElement("p", { ...props, id: `mcc:dialog-description:${context.id}` }, children);
}

function Close({ children, ...props }: BaseProps): ReactElement {
  const context = useDialogContext();
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:dialog-close:${context.id}`,
    },
    children,
  );
}

export const Dialog = { Root, Trigger, Content, Title, Description, Close };
