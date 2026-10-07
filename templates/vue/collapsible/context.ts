import { inject, type InjectionKey } from "vue";

export type RootContext = { id: string; open: boolean; disabled: boolean };

export const RootKey: InjectionKey<RootContext> = Symbol("Collapsible.Root");

export const useRoot = () => {
  const context = inject(RootKey, null);
  if (!context) throw new Error("Collapsible parts must be used within Collapsible.Root");
  return context;
};
