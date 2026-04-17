import { createContext, createElement, type ReactElement, useContext, useId } from "react"
import type { BaseProps } from "./shared.js"

type PopoverContextValue = { id: string }
const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (!context) throw new Error("Popover components must be used within Popover.Root")
  return context
}

function Root({ children, ...props }: BaseProps): ReactElement {
  const id = useId()
  return createElement(
    PopoverContext.Provider,
    { value: { id } },
    createElement("div", props, children),
  )
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
  const context = usePopoverContext()
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:popover:${context.id}`,
      "aria-controls": `mcc:popover:${context.id}`,
      "aria-expanded": "false",
    },
    children,
  )
}

function Content({ children, ...props }: BaseProps): ReactElement {
  const context = usePopoverContext()
  return createElement(
    "div",
    {
      ...props,
      id: `mcc:popover:${context.id}`,
      "aria-labelledby": `mct:popover:${context.id}`,
      "aria-hidden": "true",
      popover: "manual",
      tabIndex: -1,
    },
    children,
  )
}

export const Popover = { Root, Trigger, Content }
