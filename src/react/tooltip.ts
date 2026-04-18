import { createContext, createElement, type ReactElement, useContext, useId } from "react"
import type { BaseProps } from "./shared.js"

type TooltipContextValue = { id: string }
const TooltipContext = createContext<TooltipContextValue | null>(null)

function useTooltipContext() {
  const context = useContext(TooltipContext)
  if (!context) throw new Error("Tooltip components must be used within Tooltip.Root")
  return context
}

function Root({ children, ...props }: BaseProps): ReactElement {
  const id = useId()
  return createElement(
    TooltipContext.Provider,
    { value: { id } },
    createElement("div", props, children),
  )
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
  const context = useTooltipContext()
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:tooltip:${context.id}`,
      "aria-describedby": `mcc:tooltip:${context.id}`,
    },
    children,
  )
}

function Content({ children, ...props }: BaseProps): ReactElement {
  const context = useTooltipContext()
  return createElement(
    "div",
    {
      ...props,
      id: `mcc:tooltip:${context.id}`,
      role: "tooltip",
      popover: "manual",
    },
    children,
  )
}

export const Tooltip = { Root, Trigger, Content }
