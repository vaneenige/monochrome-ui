import "../tooltip.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, requireContext } from "./shared.js";

type TooltipContext = { id: string };

function Root(handle: Handle<BaseProps, TooltipContext>) {
  return () => {
    const { children, ...props } = handle.props;
    handle.context.set({ id: handle.id });
    return createElement("div", props, children);
  };
}

function Trigger(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Tooltip.Trigger");
    const { children, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:tooltip:${ctx.id}`,
        "aria-describedby": `mcc:tooltip:${ctx.id}`,
      },
      children,
    );
  };
}

function Content(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Tooltip.Content");
    const { children, ...props } = handle.props;
    return createElement(
      "div",
      {
        ...props,
        id: `mcc:tooltip:${ctx.id}`,
        role: "tooltip",
        popover: "manual",
      },
      children,
    );
  };
}

export const Tooltip = { Root, Trigger, Content };
