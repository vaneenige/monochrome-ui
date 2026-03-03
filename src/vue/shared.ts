import type { InjectionKey } from "vue"
import { h, inject } from "vue"

export function requireInject<T>(key: InjectionKey<T>, component: string): T {
  const ctx = inject(key)
  if (!ctx) throw new Error(`${component} must be used within its parent provider`)
  return ctx
}

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base)

export const HiddenUntilFound = () =>
  h("script", {
    innerHTML: "document.currentScript.parentNode.setAttribute('hidden','until-found')",
  })

export type CollapsibleContext = { baseId: string; open: boolean }
export const CollapsibleKey: InjectionKey<CollapsibleContext> = Symbol("CollapsibleContext")

export type AccordionContext = { baseId: string; open: boolean; disabled: boolean }
export const AccordionKey: InjectionKey<AccordionContext> = Symbol("AccordionContext")

export type TabsContext = {
  baseId: string
  selected: string
  orientation: "horizontal" | "vertical"
}
export const TabsKey: InjectionKey<TabsContext> = Symbol("TabsContext")

export type MenuContext = {
  id: string
  root?: boolean
  menubar?: boolean
  submenu?: boolean
  first?: boolean
}
export const MenuKey: InjectionKey<MenuContext> = Symbol("MenuContext")

export type MenuPopupContext = { claimFirst: () => boolean }
export const MenuPopupKey: InjectionKey<MenuPopupContext> = Symbol("MenuPopupContext")
