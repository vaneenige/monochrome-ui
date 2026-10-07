import { inject, type InjectionKey } from "vue";

export type ItemContext = { id: string; open: boolean; disabled: boolean };

export const ItemKey: InjectionKey<ItemContext> = Symbol("Accordion.Item");

export const useItem = () => {
  const context = inject(ItemKey, null);
  if (!context) throw new Error("Accordion parts must be used within Accordion.Item");
  return context;
};
