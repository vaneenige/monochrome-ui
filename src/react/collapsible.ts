import "../collapsible.js";
import { createContext, createElement, type ReactElement, use, useId } from "react";
import type { BaseProps } from "./shared.js";

type CollapsibleContextValue = { baseId: string; open: boolean; disabled: boolean };
const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const context = use(CollapsibleContext);
  if (!context) throw new Error("Collapsible components must be used within Collapsible.Root");
  return context;
}

function Root({
  children,
  open,
  disabled,
  ...props
}: BaseProps & { open?: boolean; disabled?: boolean }): ReactElement {
  const baseId = useId();
  return createElement(
    CollapsibleContext,
    { value: { baseId, open: open ?? false, disabled: disabled ?? false } },
    createElement("div", props, children),
  );
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
  const context = useCollapsibleContext();
  const fullId = context.baseId;
  const isOpen = context.open;
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:collapsible:${fullId}`,
      "aria-expanded": isOpen,
      "aria-controls": `mcc:collapsible:${fullId}`,
      "aria-disabled": context.disabled || undefined,
    },
    children,
  );
}

function Panel({ children, ...props }: BaseProps): ReactElement {
  const context = useCollapsibleContext();
  const fullId = context.baseId;
  const isOpen = context.open;
  return createElement(
    "div",
    {
      ...props,
      id: `mcc:collapsible:${fullId}`,
      "aria-labelledby": `mct:collapsible:${fullId}`,
      "aria-hidden": !isOpen,
      hidden: isOpen ? undefined : true,
    },
    children,
  );
}

export const Collapsible = { Root, Trigger, Panel };
