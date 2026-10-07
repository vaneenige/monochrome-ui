import { inject, type InjectionKey } from "vue";

export const RootKey: InjectionKey<{ id: string }> = Symbol("Tooltip.Root");

export const useRoot = () => {
  const context = inject(RootKey, null);
  if (!context) throw new Error("Tooltip parts must be used within Tooltip.Root");
  return context;
};
