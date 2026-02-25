"use client"

import { createContext, isValidElement, useContext, useId } from "react"
import { type BaseProps, buildId, HiddenUntilFound } from "./shared.js"

type TabsContextValue = {
  baseId: string
  selected?: string
  orientation: "horizontal" | "vertical"
}
const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tabs components must be used within Tabs.Root")
  return context
}

function findFirstValue(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return
  if (isValidElement(node)) {
    const nodeProps = node.props as { value?: string; children?: unknown }
    if (nodeProps.value !== undefined) return nodeProps.value
    return findFirstValue(nodeProps.children)
  }
  if (Array.isArray(node))
    for (const child of node) {
      const value = findFirstValue(child)
      if (value !== undefined) return value
    }
}

function Root({
  children,
  defaultValue,
  orientation,
  ...props
}: BaseProps & { defaultValue?: string; orientation?: "horizontal" | "vertical" }) {
  const baseId = useId()
  const dir = orientation ?? "horizontal"
  return (
    <TabsContext.Provider
      value={{ baseId, selected: defaultValue ?? findFirstValue(children), orientation: dir }}
    >
      <div {...props} data-orientation={dir} id={`mcr:tabs:${baseId}`}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function List({ children, ...props }: BaseProps) {
  const context = useTabsContext()
  return (
    <div {...props} role="tablist" aria-orientation={context.orientation}>
      {children}
    </div>
  )
}

function Tab({
  children,
  value,
  id,
  selected,
  disabled,
  ...props
}: BaseProps & { value?: string; id?: string; selected?: boolean; disabled?: boolean }) {
  const context = useTabsContext()
  const fullId = buildId(context.baseId, id ?? value)
  const isSelected = selected ?? value === context.selected
  return (
    <button
      {...props}
      type="button"
      role="tab"
      id={`mct:tabs:${fullId}`}
      aria-selected={isSelected}
      aria-controls={`mcc:tabs:${fullId}`}
      tabIndex={isSelected ? 0 : -1}
      aria-disabled={disabled || undefined}
    >
      {children}
    </button>
  )
}

function Panel({
  children,
  value,
  id,
  selected,
  focusable = true,
  ...props
}: BaseProps & { value?: string; id?: string; selected?: boolean; focusable?: boolean }) {
  const context = useTabsContext()
  const fullId = buildId(context.baseId, id ?? value)
  const isSelected = selected ?? value === context.selected
  return (
    <div
      {...props}
      role="tabpanel"
      id={`mcc:tabs:${fullId}`}
      aria-labelledby={`mct:tabs:${fullId}`}
      aria-hidden={!isSelected}
      hidden={isSelected ? undefined : true}
      tabIndex={focusable ? (isSelected ? 0 : -1) : undefined}
      data-orientation={context.orientation}
    >
      {!isSelected && <HiddenUntilFound />}
      {children}
    </div>
  )
}

export const Tabs = { Root, List, Tab, Panel }
