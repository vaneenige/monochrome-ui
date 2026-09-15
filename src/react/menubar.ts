import "../menu.js";
import { createElement, type ReactElement, useId } from "react";
import { Menu } from "./menu.js";
import { type BaseProps, MenuContext } from "./shared.js";

function Root({ children, ...props }: BaseProps): ReactElement {
  return createElement("ul", { ...props, role: "menubar" }, children);
}

function MenubarMenu({ children, ...props }: BaseProps): ReactElement {
  const id = useId();
  return createElement(
    MenuContext,
    { value: { id, item: true } },
    createElement("li", { ...props, role: "none" }, children),
  );
}

export const Menubar = {
  Root,
  Menu: MenubarMenu,
  Group: Menu.Group,
  Trigger: Menu.Trigger,
  Popover: Menu.Popover,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  RadioItem: Menu.RadioItem,
  Label: Menu.Label,
  Separator: Menu.Separator,
};
