import { createContext, createElement, type ReactElement, useContext, useId } from "react"
import { type BaseProps, HiddenUntilFound } from "./shared.js"

type CollapsibleContextValue = { baseId: string; open: boolean }
const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

function useCollapsibleContext() {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error("Collapsible components must be used within Collapsible.Root")
  return context
}

function Root({ children, open, ...props }: BaseProps & { open?: boolean }): ReactElement {
  const baseId = useId()
  return createElement(
    CollapsibleContext.Provider,
    { value: { baseId, open: open ?? false } },
    createElement("div", props, children),
  )
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
  const context = useCollapsibleContext()
  const fullId = context.baseId
  const isOpen = context.open
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:collapsible:${fullId}`,
      "aria-expanded": isOpen,
      "aria-controls": `mcc:collapsible:${fullId}`,
    },
    children,
  )
}

function Panel({ children, ...props }: BaseProps): ReactElement {
  const context = useCollapsibleContext()
  const fullId = context.baseId
  const isOpen = context.open
  return createElement(
    "div",
    {
      ...props,
      id: `mcc:collapsible:${fullId}`,
      "aria-labelledby": `mct:collapsible:${fullId}`,
      "aria-hidden": !isOpen,
      hidden: isOpen ? undefined : true,
    },
    !isOpen && createElement(HiddenUntilFound, null),
    children,
  )
}

export const Collapsible = { Root, Trigger, Panel }
