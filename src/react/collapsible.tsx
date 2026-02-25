"use client"

import { createContext, useContext, useId } from "react"
import { type BaseProps, HiddenUntilFound } from "./shared.js"

type CollapsibleContextValue = { baseId: string; open: boolean }
const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

function useCollapsibleContext() {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error("Collapsible components must be used within Collapsible.Root")
  return context
}

function Root({ children, open, ...props }: BaseProps & { open?: boolean }) {
  const baseId = useId()
  return (
    <CollapsibleContext.Provider value={{ baseId, open: open ?? false }}>
      <div {...props}>{children}</div>
    </CollapsibleContext.Provider>
  )
}

function Trigger({ children, ...props }: BaseProps) {
  const context = useCollapsibleContext()
  const fullId = context.baseId
  const isOpen = context.open
  return (
    <button
      {...props}
      type="button"
      id={`mct:collapsible:${fullId}`}
      aria-expanded={isOpen}
      aria-controls={`mcc:collapsible:${fullId}`}
    >
      {children}
    </button>
  )
}

function Panel({ children, ...props }: BaseProps) {
  const context = useCollapsibleContext()
  const fullId = context.baseId
  const isOpen = context.open
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: WAI-ARIA disclosure pattern
    <div
      {...props}
      id={`mcc:collapsible:${fullId}`}
      aria-labelledby={`mct:collapsible:${fullId}`}
      aria-hidden={!isOpen}
      hidden={isOpen ? undefined : true}
    >
      {!isOpen && <HiddenUntilFound />}
      {children}
    </div>
  )
}

export const Collapsible = { Root, Trigger, Panel }
