import { inject, type InjectionKey } from "vue";

export const RootKey: InjectionKey<{ id: string }> = Symbol("Popover.Root");

export const useRoot = () => {
  const context = inject(RootKey, null);
  if (!context) throw new Error("Popover parts must be used within Popover.Root");
  return context;
};
