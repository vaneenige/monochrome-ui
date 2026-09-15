import "../menu.js";
import { defineComponent, h, provide, useId } from "vue";
import { Menu } from "./menu.js";
import { MenuKey } from "./shared.js";

const Root = defineComponent({
  setup(_, { slots }) {
    return () => h("ul", { role: "menubar" }, slots.default?.());
  },
});

const MenubarMenu = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(MenuKey, { id, item: true });
    return () => h("li", { role: "none" }, slots.default?.());
  },
});

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
