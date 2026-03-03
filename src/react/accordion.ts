import { createContext, createElement, type ReactElement, useContext, useId } from "react"
import { type BaseProps, HiddenUntilFound } from "./shared.js"

type AccordionContextValue = { baseId: string; open: boolean; disabled: boolean }
const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordionContext() {
  const context = useContext(AccordionContext)
  if (!context) throw new Error("Accordion components must be used within Accordion.Item")
  return context
}

function Root({
  children,
  type,
  ...props
}: BaseProps & { type?: "single" | "multiple" }): ReactElement {
  const id = useId()
  return createElement(
    "div",
    { ...props, "data-mode": type ?? "single", id: `mcr:accordion:${id}` },
    children,
  )
}

function Item({
  children,
  open,
  disabled,
  ...props
}: BaseProps & { open?: boolean; disabled?: boolean }): ReactElement {
  const baseId = useId()
  return createElement(
    AccordionContext.Provider,
    { value: { baseId, open: open ?? false, disabled: disabled ?? false } },
    createElement("div", props, children),
  )
}

function Header({
  children,
  as,
  ...props
}: BaseProps & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }): ReactElement {
  return createElement(as ?? "h3", props, children)
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
  const context = useAccordionContext()
  const fullId = context.baseId
  const isOpen = context.open
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:accordion:${fullId}`,
      "aria-expanded": isOpen,
      "aria-controls": `mcc:accordion:${fullId}`,
      "aria-disabled": context.disabled || undefined,
    },
    children,
  )
}

function Panel({ children, ...props }: BaseProps): ReactElement {
  const context = useAccordionContext()
  const fullId = context.baseId
  const isOpen = context.open
  return createElement(
    "div",
    {
      ...props,
      id: `mcc:accordion:${fullId}`,
      role: "region",
      "aria-labelledby": `mct:accordion:${fullId}`,
      "aria-hidden": !isOpen,
      hidden: isOpen ? undefined : true,
    },
    !isOpen && createElement(HiddenUntilFound, null),
    children,
  )
}

export const Accordion = { Root, Item, Header, Trigger, Panel }
