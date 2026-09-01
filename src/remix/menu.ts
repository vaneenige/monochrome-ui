import "../menu.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, requireContext } from "./shared.js";

type MenuContext = {
  id: string;
  root?: boolean;
  submenu?: boolean;
};

function menuContext<P>(handle: Handle<P>) {
  return requireContext(handle.context.get(Group) || handle.context.get(Root), "Menu");
}

function Root(handle: Handle<Pick<BaseProps, "children">, MenuContext>) {
  handle.context.set({ id: handle.id, root: true });
  return () => handle.props.children;
}

function Trigger(handle: Handle<BaseProps & { disabled?: boolean }>) {
  return () => {
    const ctx = menuContext(handle);
    const { children, disabled, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:menu:${ctx.id}`,
        "aria-controls": `mcc:menu:${ctx.id}`,
        "aria-expanded": "false",
        "aria-haspopup": "menu",
        tabIndex: ctx.root ? 0 : -1,
        role: ctx.submenu ? "menuitem" : "button",
        ...(disabled ? { "aria-disabled": "true" } : {}),
      },
      children,
    );
  };
}

function Popover(handle: Handle<BaseProps>) {
  return () => {
    const ctx = menuContext(handle);
    const { children, ...props } = handle.props;
    return createElement(
      "ul",
      {
        ...props,
        role: "menu",
        id: `mcc:menu:${ctx.id}`,
        "aria-labelledby": `mct:menu:${ctx.id}`,
        "aria-hidden": "true",
        popover: "manual",
      },
      children,
    );
  };
}

function Item(handle: Handle<BaseProps & { disabled?: boolean; href?: string }>) {
  return () => {
    const { children, disabled, href, ...props } = handle.props;
    const inner = disabled
      ? createElement(
          "span",
          { ...props, role: "menuitem", "aria-disabled": "true", tabIndex: -1 },
          children,
        )
      : href
        ? createElement("a", { ...props, role: "menuitem", href, tabIndex: -1 }, children)
        : createElement(
            "button",
            { ...props, type: "button", role: "menuitem", tabIndex: -1 },
            children,
          );
    return createElement("li", { role: "none" }, inner);
  };
}

function CheckboxItem(handle: Handle<BaseProps & { checked?: boolean; disabled?: boolean }>) {
  return () => {
    const { children, checked, disabled, ...props } = handle.props;
    const inner = disabled
      ? createElement(
          "span",
          {
            ...props,
            role: "menuitemcheckbox",
            "aria-checked": checked ? "true" : "false",
            "aria-disabled": "true",
            tabIndex: -1,
          },
          children,
        )
      : createElement(
          "button",
          {
            ...props,
            type: "button",
            role: "menuitemcheckbox",
            "aria-checked": checked ? "true" : "false",
            tabIndex: -1,
          },
          children,
        );
    return createElement("li", { role: "none" }, inner);
  };
}

function RadioItem(handle: Handle<BaseProps & { checked?: boolean; disabled?: boolean }>) {
  return () => {
    const { children, checked, disabled, ...props } = handle.props;
    const inner = disabled
      ? createElement(
          "span",
          {
            ...props,
            role: "menuitemradio",
            "aria-checked": checked ? "true" : "false",
            "aria-disabled": "true",
            tabIndex: -1,
          },
          children,
        )
      : createElement(
          "button",
          {
            ...props,
            type: "button",
            role: "menuitemradio",
            "aria-checked": checked ? "true" : "false",
            tabIndex: -1,
          },
          children,
        );
    return createElement("li", { role: "none" }, inner);
  };
}

function Label(handle: Handle<BaseProps>) {
  return () => {
    const { children, ...props } = handle.props;
    return createElement("li", { ...props, role: "presentation" }, children);
  };
}

function Separator(handle: Handle<Omit<BaseProps, "children">>) {
  return () => createElement("li", { ...handle.props, role: "separator" });
}

function Group(handle: Handle<BaseProps, MenuContext>) {
  handle.context.set({ id: handle.id, submenu: true });
  return () => {
    const { children, ...props } = handle.props;
    return createElement("li", { ...props, role: "none" }, children);
  };
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
