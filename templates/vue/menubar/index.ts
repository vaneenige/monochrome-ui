import "monochrome/menubar";
import { Menu } from "../menu";
import MenubarMenu from "./Menu.vue";
import Root from "./Root.vue";

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
