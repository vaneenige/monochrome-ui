import "../menu.js";
import { createElement, type Handle } from "remix/ui";
import { Menu } from "./menu.js";
import { type BaseProps, requireContext } from "./shared.js";

type MenubarSlot = { id: string; first: boolean };
type MenubarClaim = { claimFirst: (id: string) => boolean };

function Root(handle: Handle<BaseProps, MenubarClaim>) {
  let claimed: string | null = null;
  handle.context.set({
    claimFirst: (id: string) => {
      if (claimed === null || claimed === id) {
        claimed = id;
        return true;
      }
      return false;
    },
  });
  return () => {
    claimed = null;
    const { children, ...props } = handle.props;
    return createElement("ul", { ...props, role: "menubar" }, children);
  };
}

function MenubarMenu(handle: Handle<BaseProps, MenubarSlot>) {
  const claim = requireContext(handle.context.get(Root), "Menubar.Menu");
  return () => {
    const { children, ...props } = handle.props;
    handle.context.set({ id: handle.id, first: claim.claimFirst(handle.id) });
    return createElement("li", { ...props, role: "none" }, children);
  };
}

function Group(handle: Handle<BaseProps, MenubarSlot>) {
  handle.context.set({ id: handle.id, first: false });
  return () => {
    const { children, ...props } = handle.props;
    return createElement("li", { ...props, role: "none" }, children);
  };
}

function menubarSlot<P>(handle: Handle<P>) {
  return requireContext(handle.context.get(Group) || handle.context.get(MenubarMenu), "Menubar");
}

function Trigger(handle: Handle<BaseProps & { disabled?: boolean }>) {
  return () => {
    const slot = menubarSlot(handle);
    const { children, disabled, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:menu:${slot.id}`,
        "aria-controls": `mcc:menu:${slot.id}`,
        "aria-expanded": "false",
        "aria-haspopup": "menu",
        tabIndex: slot.first ? 0 : -1,
        role: "menuitem",
        ...(disabled ? { "aria-disabled": "true" } : {}),
      },
      children,
    );
  };
}

function Popover(handle: Handle<BaseProps>) {
  return () => {
    const slot = menubarSlot(handle);
    const { children, ...props } = handle.props;
    return createElement(
      "ul",
      {
        ...props,
        role: "menu",
        id: `mcc:menu:${slot.id}`,
        "aria-labelledby": `mct:menu:${slot.id}`,
        "aria-hidden": "true",
        popover: "manual",
      },
      children,
    );
  };
}

export const Menubar = {
  Root,
  Menu: MenubarMenu,
  Group,
  Trigger,
  Popover,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  RadioItem: Menu.RadioItem,
  Label: Menu.Label,
  Separator: Menu.Separator,
};
