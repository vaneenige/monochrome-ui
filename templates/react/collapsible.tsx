"use client";

import "monochrome/collapsible";
import { type ComponentProps, createContext, use, useId } from "react";

type RootContext = { id: string; open: boolean; disabled: boolean };

const CollapsibleContext = createContext<RootContext | null>(null);

function useRoot() {
  const context = use(CollapsibleContext);
  if (!context) throw new Error("Collapsible parts must be used within Collapsible.Root");
  return context;
}

function Root({
  defaultOpen = false,
  disabled = false,
  ...props
}: ComponentProps<"div"> & { defaultOpen?: boolean; disabled?: boolean }) {
  const id = useId();
  return (
    <CollapsibleContext value={{ id, open: defaultOpen, disabled }}>
      <div {...props} data-slot="collapsible" id={`mcr:collapsible:${id}`} />
    </CollapsibleContext>
  );
}

function Trigger({ onClick, ...props }: ComponentProps<"button">) {
  const { id, open, disabled } = useRoot();
  return (
    <button
      {...props}
      onClick={disabled ? undefined : onClick}
      data-slot="collapsible-trigger"
      type="button"
      id={`mct:collapsible:${id}`}
      aria-expanded={open}
      aria-controls={`mcc:collapsible:${id}`}
      aria-disabled={disabled || undefined}
    />
  );
}

function Panel(props: ComponentProps<"div">) {
  const { id, open } = useRoot();
  return (
    <div
      aria-labelledby={props.role === "region" ? `mct:collapsible:${id}` : undefined}
      {...props}
      data-slot="collapsible-panel"
      id={`mcc:collapsible:${id}`}
      hidden={open ? undefined : true}
    />
  );
}

export const Collapsible = { Root, Trigger, Panel };
