import type { HTMLAttributes, ReactNode } from "react";

export type BaseProps = HTMLAttributes<HTMLElement> & { children: ReactNode };

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base);
