import { createContext, type HTMLAttributes, type ReactNode, type Ref } from "react";

export type BaseProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  ref?: Ref<HTMLElement>;
};

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base);

export type MenuContextValue = { id: string; tabStop: boolean; item: boolean };
export const MenuContext = createContext<MenuContextValue | null>(null);
