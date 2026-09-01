import "../tabs.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, buildId, requireContext } from "./shared.js";

type TabsContext = {
  id: string;
  selected: string;
  orientation: "horizontal" | "vertical";
};

function Root(
  handle: Handle<
    BaseProps & {
      defaultValue: string;
      orientation?: "horizontal" | "vertical";
    },
    TabsContext
  >,
) {
  return () => {
    const { children, defaultValue, orientation, ...props } = handle.props;
    const dir = orientation ?? "horizontal";
    handle.context.set({ id: handle.id, selected: defaultValue, orientation: dir });
    return createElement("div", { ...props, id: `mcr:tabs:${handle.id}` }, children);
  };
}

function List(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Tabs.List");
    const { children, ...props } = handle.props;
    return createElement(
      "div",
      { ...props, role: "tablist", "aria-orientation": ctx.orientation },
      children,
    );
  };
}

function Tab(
  handle: Handle<BaseProps & { value: string; selected?: boolean; disabled?: boolean }>,
) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Tabs.Tab");
    const { children, value, selected, disabled, ...props } = handle.props;
    const fullId = buildId(ctx.id, value);
    const isSelected = selected ?? value === ctx.selected;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        role: "tab",
        id: `mct:tabs:${fullId}`,
        "aria-selected": isSelected ? "true" : "false",
        "aria-controls": `mcc:tabs:${fullId}`,
        tabIndex: isSelected ? 0 : -1,
        "aria-disabled": disabled ? "true" : undefined,
      },
      children,
    );
  };
}

function Panel(
  handle: Handle<BaseProps & { value: string; selected?: boolean; focusable?: boolean }>,
) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Tabs.Panel");
    const { children, value, selected, focusable = true, ...props } = handle.props;
    const fullId = buildId(ctx.id, value);
    const isSelected = selected ?? value === ctx.selected;
    return createElement(
      "div",
      {
        ...props,
        role: "tabpanel",
        id: `mcc:tabs:${fullId}`,
        "aria-labelledby": `mct:tabs:${fullId}`,
        "aria-hidden": isSelected ? "false" : "true",
        hidden: isSelected ? undefined : true,
        tabIndex: focusable ? (isSelected ? 0 : -1) : undefined,
      },
      children,
    );
  };
}

export const Tabs = { Root, List, Tab, Panel };
