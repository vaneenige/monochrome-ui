"use client";

import "monochrome/menu";
import "monochrome/popover";
import { type ComponentProps, createContext, use, useId } from "react";

const PopoverContext = createContext<{ id: string } | null>(null);

function useRoot() {
  const context = use(PopoverContext);
  if (!context) throw new Error("Popover parts must be used within Popover.Root");
  return context;
}

type Heading = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

function Root(props: ComponentProps<"div">) {
  const id = useId();
  return (
    <PopoverContext value={{ id }}>
      <div {...props} data-slot="popover" />
    </PopoverContext>
  );
}

function Trigger({ disabled, onClick, ...props }: ComponentProps<"button">) {
  const { id } = useRoot();
  return (
    <button
      {...props}
      onClick={disabled ? undefined : onClick}
      data-slot="popover-trigger"
      type="button"
      id={`mct:popover:${id}`}
      aria-controls={`mcc:popover:${id}`}
      aria-expanded="false"
      aria-disabled={disabled ? "true" : props["aria-disabled"]}
    />
  );
}

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

function Content({
  side,
  align,
  ...props
}: ComponentProps<"div"> & { side?: Side; align?: Align }) {
  const { id } = useRoot();
  return (
    <div
      data-mc-side={side}
      data-mc-align={align}
      role="dialog"
      aria-labelledby={"aria-label" in props ? undefined : `mct:popover:${id}`}
      aria-describedby={"aria-description" in props ? undefined : `mcc:popover-description:${id}`}
      {...props}
      data-slot="popover-content"
      id={`mcc:popover:${id}`}
      popover="manual"
      tabIndex={-1}
    />
  );
}

function Title({ as: Tag = "h2", ...props }: ComponentProps<"h2"> & { as?: Heading }) {
  const { id } = useRoot();
  return <Tag {...props} data-slot="popover-title" id={`mcc:popover-title:${id}`} />;
}

function Description(props: ComponentProps<"p">) {
  const { id } = useRoot();
  return <p {...props} data-slot="popover-description" id={`mcc:popover-description:${id}`} />;
}

export const Popover = { Root, Trigger, Content, Title, Description };
