import { createContext, createElement, type ReactElement, useContext, useId } from "react"
import { type BaseProps, buildId, HiddenUntilFound } from "./shared.js"

type TabsContextValue = {
  baseId: string
  selected: string
  orientation: "horizontal" | "vertical"
}
const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tabs components must be used within Tabs.Root")
  return context
}

function Root({
  children,
  defaultValue,
  orientation,
  ...props
}: BaseProps & { defaultValue: string; orientation?: "horizontal" | "vertical" }): ReactElement {
  const baseId = useId()
  const dir = orientation ?? "horizontal"
  return createElement(
    TabsContext.Provider,
    { value: { baseId, selected: defaultValue, orientation: dir } },
    createElement("div", { ...props, "data-orientation": dir, id: `mcr:tabs:${baseId}` }, children),
  )
}

function List({ children, ...props }: BaseProps): ReactElement {
  const context = useTabsContext()
  return createElement(
    "div",
    { ...props, role: "tablist", "aria-orientation": context.orientation },
    children,
  )
}

function Tab({
  children,
  value,
  selected,
  disabled,
  ...props
}: BaseProps & { value: string; selected?: boolean; disabled?: boolean }): ReactElement {
  const context = useTabsContext()
  const fullId = buildId(context.baseId, value)
  const isSelected = selected ?? value === context.selected
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      role: "tab",
      id: `mct:tabs:${fullId}`,
      "aria-selected": isSelected,
      "aria-controls": `mcc:tabs:${fullId}`,
      tabIndex: isSelected ? 0 : -1,
      "aria-disabled": disabled || undefined,
    },
    children,
  )
}

function Panel({
  children,
  value,
  selected,
  focusable = true,
  ...props
}: BaseProps & { value: string; selected?: boolean; focusable?: boolean }): ReactElement {
  const context = useTabsContext()
  const fullId = buildId(context.baseId, value)
  const isSelected = selected ?? value === context.selected
  return createElement(
    "div",
    {
      ...props,
      role: "tabpanel",
      id: `mcc:tabs:${fullId}`,
      "aria-labelledby": `mct:tabs:${fullId}`,
      "aria-hidden": !isSelected,
      hidden: isSelected ? undefined : true,
      tabIndex: focusable ? (isSelected ? 0 : -1) : undefined,
      "data-orientation": context.orientation,
    },
    !isSelected && createElement(HiddenUntilFound, null),
    children,
  )
}

export const Tabs = { Root, List, Tab, Panel }
