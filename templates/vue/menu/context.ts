import { inject, type InjectionKey } from "vue";

export type MenuContext = { id: string; item: boolean };

export const MenuKey: InjectionKey<MenuContext> = Symbol("Menu");

export const useMenu = () => {
  const context = inject(MenuKey, null);
  if (!context) throw new Error("Menu parts must be used within Menu.Root");
  return context;
};
