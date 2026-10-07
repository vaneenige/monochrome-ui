import { inject, type InjectionKey } from "vue";

export type RootContext = {
  id: string;
  selected: string;
  orientation: "horizontal" | "vertical";
};

export const RootKey: InjectionKey<RootContext> = Symbol("Tabs.Root");

export const useRoot = () => {
  const context = inject(RootKey, null);
  if (!context) throw new Error("Tabs parts must be used within Tabs.Root");
  return context;
};

export const part = (id: string, value: string) => (value ? `${id}:${value}` : id);
