"use client";

import "monochrome/menu";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  use,
  useId,
} from "react";

export const MenuContext = createContext<{ id: string; item: boolean } | null>(null);

function useMenu() {
  const context = use(MenuContext);
  if (!context) throw new Error("Menu parts must be used within Menu.Root");
  return context;
}

function Root({ children }: { children: ReactNode }) {
  const id = useId();
  return <MenuContext value={{ id, item: false }}>{children}</MenuContext>;
}

function Trigger({ disabled, onClick, tabIndex, ...props }: ComponentProps<"button">) {
  const { id, item } = useMenu();
  return (
    <button
      {...props}
      onClick={disabled ? undefined : onClick}
      data-slot="menu-trigger"
      type="button"
      id={`mct:menu:${id}`}
      aria-controls={`mcc:menu:${id}`}
      aria-expanded="false"
      aria-haspopup="menu"
      tabIndex={tabIndex ?? (item ? -1 : 0)}
      role={item ? "menuitem" : "button"}
      aria-disabled={disabled ? "true" : props["aria-disabled"]}
    />
  );
}

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

function Popover({ side, align, ...props }: ComponentProps<"ul"> & { side?: Side; align?: Align }) {
  const { id, item } = useMenu();
  return (
    <MenuContext value={{ id, item }}>
      <ul
        data-mc-side={side}
        data-mc-align={align}
        {...props}
        data-slot="menu-content"
        role="menu"
        id={`mcc:menu:${id}`}
        aria-labelledby={`mct:menu:${id}`}
        popover="manual"
      />
    </MenuContext>
  );
}

type ItemProps = HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  href?: string;
  defaultChecked?: boolean;
  keepOpen?: boolean;
};

function useRow(
  role: "menuitem" | "menuitemcheckbox" | "menuitemradio",
  { children, defaultChecked, disabled, href, keepOpen, onClick, tabIndex, ...props }: ItemProps,
) {
  const shared = {
    ...props,
    "data-slot": "menu-item",
    role,
    tabIndex: tabIndex ?? -1,
    "aria-checked": role === "menuitem" ? undefined : (defaultChecked ?? false),
    "data-mc-keep-open": keepOpen ? "" : undefined,
  };
  return (
    <li role="none">
      {disabled ? (
        <span {...shared} aria-disabled="true">
          {children}
        </span>
      ) : href ? (
        <a {...shared} href={href} onClick={onClick}>
          {children}
        </a>
      ) : (
        <button {...shared} type="button" onClick={onClick}>
          {children}
        </button>
      )}
    </li>
  );
}

function Item(props: Omit<ItemProps, "defaultChecked">) {
  return useRow("menuitem", props);
}

function CheckboxItem(props: Omit<ItemProps, "href">) {
  return useRow("menuitemcheckbox", props);
}

function RadioItem(props: Omit<ItemProps, "href">) {
  return useRow("menuitemradio", props);
}

function Label(props: ComponentProps<"li">) {
  return <li {...props} data-slot="menu-label" role="presentation" />;
}

function Separator(props: Omit<ComponentProps<"li">, "children">) {
  return <li {...props} data-slot="menu-separator" role="separator" />;
}

function Group({ label, children, ...props }: ComponentProps<"ul"> & { label?: ReactNode }) {
  const id = `mcc:menu-label:${useId()}`;
  return (
    <li role="none">
      <ul aria-labelledby={label ? id : undefined} {...props} data-slot="menu-group" role="group">
        {label ? <Label id={id}>{label}</Label> : null}
        {children}
      </ul>
    </li>
  );
}

function Sub(props: ComponentProps<"li">) {
  const id = useId();
  return (
    <MenuContext value={{ id, item: true }}>
      <li {...props} data-slot="menu-sub" role="none" />
    </MenuContext>
  );
}

export const Menu = {
  Root,
  Trigger,
  Popover,
  Item,
  CheckboxItem,
  RadioItem,
  Label,
  Separator,
  Group,
  Sub,
};
