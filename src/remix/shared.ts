import type { MixInput, Props } from "remix/ui";

export type BaseProps = Omit<Props<"div">, "mix"> & {
  mix?: MixInput<HTMLElement>;
};

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base);

export function requireContext<T>(value: T, component: string): NonNullable<T> {
  if (!value) throw new Error(`${component} must be used within its parent`);
  return value;
}
