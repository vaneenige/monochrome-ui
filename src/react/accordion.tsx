"use client"

import { createContext, useContext, useId } from "react"
import { type BaseProps, HiddenUntilFound } from "./shared.js"

type AccordionContextValue = { baseId: string; open: boolean; disabled: boolean }
const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordionContext() {
  const context = useContext(AccordionContext)
  if (!context) throw new Error("Accordion components must be used within Accordion.Item")
  return context
}

function Root({ children, type, ...props }: BaseProps & { type?: "single" | "multiple" }) {
  const id = useId()
  return (
    <div {...props} data-mode={type ?? "single"} id={`mcr:accordion:${id}`}>
      {children}
    </div>
  )
}

function Item({
  children,
  open,
  disabled,
  ...props
}: BaseProps & { open?: boolean; disabled?: boolean }) {
  const baseId = useId()
  return (
    <AccordionContext.Provider value={{ baseId, open: open ?? false, disabled: disabled ?? false }}>
      <div {...props}>{children}</div>
    </AccordionContext.Provider>
  )
}

function Header({
  children,
  as,
  ...props
}: BaseProps & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }) {
  const Heading = as ?? "h3"
  return <Heading {...props}>{children}</Heading>
}

function Trigger({ children, ...props }: BaseProps) {
  const context = useAccordionContext()
  const fullId = context.baseId
  const isOpen = context.open
  return (
    <button
      {...props}
      type="button"
      id={`mct:accordion:${fullId}`}
      aria-expanded={isOpen}
      aria-controls={`mcc:accordion:${fullId}`}
      aria-disabled={context.disabled || undefined}
    >
      {children}
    </button>
  )
}

function Panel({ children, ...props }: BaseProps) {
  const context = useAccordionContext()
  const fullId = context.baseId
  const isOpen = context.open
  return (
    // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA Accordion Pattern
    <div
      {...props}
      id={`mcc:accordion:${fullId}`}
      role="region"
      aria-labelledby={`mct:accordion:${fullId}`}
      aria-hidden={!isOpen}
      hidden={isOpen ? undefined : true}
    >
      {!isOpen && <HiddenUntilFound />}
      {children}
    </div>
  )
}

export const Accordion = { Root, Item, Header, Trigger, Panel }
