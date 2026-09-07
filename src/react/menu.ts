import "../menu.js";
import { createElement, type ReactElement, type ReactNode, use, useId } from "react";
import { type BaseProps, MenuContext } from "./shared.js";

function useMenuContext() {
  const context = use(MenuContext);
  if (!context) throw new Error("Menu components must be used within Menu.Root");
  return context;
}

function Root({ children }: { children: ReactNode }): ReactElement {
  const id = useId();
  return createElement(MenuContext, { value: { id, tabStop: true, item: false } }, children);
}

function Trigger({
  children,
  disabled,
  ...props
}: BaseProps & { disabled?: boolean }): ReactElement {
  const context = useMenuContext();
  return createElement(
    "button",
    {
      ...props,
      type: "button",
      id: `mct:menu:${context.id}`,
      "aria-controls": `mcc:menu:${context.id}`,
      "aria-expanded": "false",
      "aria-haspopup": "menu",
      tabIndex: context.tabStop ? 0 : -1,
      role: context.item ? "menuitem" : "button",
      ...(disabled ? { "aria-disabled": "true" } : {}),
    },
    children,
  );
}

function Popover({ children, ...props }: BaseProps): ReactElement {
  const context = useMenuContext();
  return createElement(
    "ul",
    {
      ...props,
      role: "menu",
      id: `mcc:menu:${context.id}`,
      "aria-labelledby": `mct:menu:${context.id}`,
      popover: "manual",
    },
    children,
  );
}

type ItemProps = BaseProps & { disabled?: boolean; href?: string };
type CheckedItemProps = BaseProps & { disabled?: boolean; checked?: boolean | undefined };

const menuItem = (role: string, checkable: boolean) =>
  function MenuItem({
    children,
    checked,
    disabled,
    href,
    ...props
  }: ItemProps & CheckedItemProps): ReactElement {
    const shared = {
      ...props,
      role,
      tabIndex: -1,
      ...(checkable ? { "aria-checked": checked ?? false } : {}),
    };
    const inner = disabled
      ? createElement("span", { ...shared, "aria-disabled": "true" }, children)
      : href
        ? createElement("a", { ...shared, href }, children)
        : createElement("button", { ...shared, type: "button" }, children);
    return createElement("li", { role: "none" }, inner);
  };

const Item: (props: ItemProps) => ReactElement = menuItem("menuitem", false);
const CheckboxItem: (props: CheckedItemProps) => ReactElement = menuItem("menuitemcheckbox", true);
const RadioItem: (props: CheckedItemProps) => ReactElement = menuItem("menuitemradio", true);

function Label({ children, ...props }: BaseProps): ReactElement {
  return createElement("li", { ...props, role: "presentation" }, children);
}

function Separator(props: Omit<BaseProps, "children">): ReactElement {
  return createElement("li", { ...props, role: "separator" });
}

function Group({ children, ...props }: BaseProps): ReactElement {
  const id = useId();
  return createElement(
    MenuContext,
    { value: { id, tabStop: false, item: true } },
    createElement("li", { ...props, role: "none" }, children),
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
};
