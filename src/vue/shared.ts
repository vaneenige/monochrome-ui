import type { InjectionKey } from "vue";
import { inject } from "vue";

export function requireInject<T>(key: InjectionKey<T>, component: string): T {
  const ctx = inject(key);
  if (!ctx) throw new Error(`${component} must be used within its parent provider`);
  return ctx;
}

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base);

export type CollapsibleContext = {
  baseId: string;
  open: boolean;
  disabled: boolean;
};
export const CollapsibleKey: InjectionKey<CollapsibleContext> = Symbol();

export type AccordionContext = {
  baseId: string;
  open: boolean;
  disabled: boolean;
};
export const AccordionKey: InjectionKey<AccordionContext> = Symbol();

export type TabsContext = {
  baseId: string;
  selected: string;
  orientation: "horizontal" | "vertical";
};
export const TabsKey: InjectionKey<TabsContext> = Symbol();

export type MenuContext = {
  id: string;
  tabStop: boolean;
  item: boolean;
};
export const MenuKey: InjectionKey<MenuContext> = Symbol();

export type MenubarClaimContext = {
  claimFirst: (id: string) => boolean;
  release: (id: string) => void;
};
export const MenubarClaimKey: InjectionKey<MenubarClaimContext> = Symbol();

export type PopoverContext = { id: string };
export const PopoverKey: InjectionKey<PopoverContext> = Symbol();

export type TooltipContext = { id: string };
export const TooltipKey: InjectionKey<TooltipContext> = Symbol();

export type DialogContext = { id: string };
export const DialogKey: InjectionKey<DialogContext> = Symbol();
