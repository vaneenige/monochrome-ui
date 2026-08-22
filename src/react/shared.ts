import type { HTMLAttributes, ReactNode, Ref } from "react";

export type BaseProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  ref?: Ref<HTMLElement>;
};

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base);
