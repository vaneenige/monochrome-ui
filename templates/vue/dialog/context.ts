import { inject, type InjectionKey } from "vue";

export const RootKey: InjectionKey<{ id: string }> = Symbol("Dialog.Root");

export const useRoot = () => {
  const context = inject(RootKey, null);
  if (!context) throw new Error("Dialog parts must be used within Dialog.Root");
  return context;
};
