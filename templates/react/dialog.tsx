"use client";

import "monochrome/dialog";
import { type ComponentProps, createContext, use, useId } from "react";

const DialogContext = createContext<{ id: string } | null>(null);

function useRoot() {
  const context = use(DialogContext);
  if (!context) throw new Error("Dialog parts must be used within Dialog.Root");
  return context;
}

type Heading = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

function Root(props: ComponentProps<"div">) {
  const id = useId();
  return (
    <DialogContext value={{ id }}>
      <div {...props} data-slot="dialog" />
    </DialogContext>
  );
}

function Trigger({ disabled, onClick, ...props }: ComponentProps<"button">) {
  const { id } = useRoot();
  return (
    <button
      {...props}
      onClick={disabled ? undefined : onClick}
      data-slot="dialog-trigger"
      type="button"
      id={`mct:dialog-open:${id}`}
      aria-haspopup="dialog"
      aria-controls={`mcc:dialog:${id}`}
      aria-disabled={disabled ? "true" : props["aria-disabled"]}
    />
  );
}

function Content({
  initialFocus,
  ...props
}: ComponentProps<"dialog"> & { initialFocus?: "close" | (string & {}) }) {
  const { id } = useRoot();
  return (
    <dialog
      aria-labelledby={"aria-label" in props ? undefined : `mcc:dialog-title:${id}`}
      aria-describedby={"aria-description" in props ? undefined : `mcc:dialog-description:${id}`}
      data-mc-autofocus={initialFocus === "close" ? `mct:dialog-close:${id}` : initialFocus}
      {...props}
      data-slot="dialog-content"
      id={`mcc:dialog:${id}`}
      tabIndex={-1}
    />
  );
}

function Title({ as: Tag = "h2", ...props }: ComponentProps<"h2"> & { as?: Heading }) {
  const { id } = useRoot();
  return <Tag {...props} data-slot="dialog-title" id={`mcc:dialog-title:${id}`} />;
}

function Description(props: ComponentProps<"p">) {
  const { id } = useRoot();
  return <p {...props} data-slot="dialog-description" id={`mcc:dialog-description:${id}`} />;
}

function Close(props: ComponentProps<"button">) {
  const { id } = useRoot();
  return <button {...props} data-slot="dialog-close" type="button" id={`mct:dialog-close:${id}`} />;
}

function Action(props: ComponentProps<"button">) {
  return <button type="button" {...props} data-slot="dialog-action" />;
}

export const Dialog = { Root, Trigger, Content, Title, Description, Close, Action };
