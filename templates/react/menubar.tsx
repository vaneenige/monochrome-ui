"use client";

import "monochrome/menubar";
import { type ComponentProps, useId } from "react";
import { Menu, MenuContext } from "./menu";

function Root(props: ComponentProps<"ul">) {
  return (
    <MenuContext value={{ id: "", item: true }}>
      <ul {...props} data-slot="menubar" role="menubar" />
    </MenuContext>
  );
}

function MenubarMenu(props: ComponentProps<"li">) {
  const id = useId();
  return (
    <MenuContext value={{ id, item: true }}>
      <li {...props} data-slot="menubar-menu" role="none" />
    </MenuContext>
  );
}

export const Menubar = {
  Root,
  Menu: MenubarMenu,
  Sub: Menu.Sub,
  Group: Menu.Group,
  Trigger: Menu.Trigger,
  Popover: Menu.Popover,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  RadioItem: Menu.RadioItem,
  Label: Menu.Label,
  Separator: Menu.Separator,
};
