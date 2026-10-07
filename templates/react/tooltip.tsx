"use client";

import "monochrome/tooltip";
import { type ComponentProps, createContext, use, useId } from "react";

const TooltipContext = createContext<{ id: string } | null>(null);

function useRoot() {
  const context = use(TooltipContext);
  if (!context) throw new Error("Tooltip parts must be used within Tooltip.Root");
  return context;
}

function Root(props: ComponentProps<"div">) {
  const id = useId();
  return (
    <TooltipContext value={{ id }}>
      <div {...props} data-slot="tooltip" />
    </TooltipContext>
  );
}

function Trigger(props: ComponentProps<"button">) {
  const { id } = useRoot();
  return (
    <button
      {...props}
      data-slot="tooltip-trigger"
      type="button"
      id={`mct:tooltip:${id}`}
      aria-describedby={`mcc:tooltip:${id}`}
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
      {...props}
      data-slot="tooltip-content"
      id={`mcc:tooltip:${id}`}
      role="tooltip"
      popover="manual"
    />
  );
}

export const Tooltip = { Root, Trigger, Content };
