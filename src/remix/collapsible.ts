import "../collapsible.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, requireContext } from "./shared.js";

type CollapsibleContext = { id: string; open: boolean; disabled: boolean };

function Root(
  handle: Handle<BaseProps & { open?: boolean; disabled?: boolean }, CollapsibleContext>,
) {
  return () => {
    const { children, open, disabled, ...props } = handle.props;
    handle.context.set({
      id: handle.id,
      open: open ?? false,
      disabled: disabled ?? false,
    });
    return createElement("div", props, children);
  };
}

function Trigger(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Collapsible.Trigger");
    const { children, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:collapsible:${ctx.id}`,
        "aria-expanded": ctx.open ? "true" : "false",
        "aria-controls": `mcc:collapsible:${ctx.id}`,
        "aria-disabled": ctx.disabled ? "true" : undefined,
      },
      children,
    );
  };
}

function Panel(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Collapsible.Panel");
    const { children, ...props } = handle.props;
    return createElement(
      "div",
      {
        ...props,
        id: `mcc:collapsible:${ctx.id}`,
        "aria-labelledby": `mct:collapsible:${ctx.id}`,
        "aria-hidden": ctx.open ? "false" : "true",
        hidden: ctx.open ? undefined : true,
      },
      children,
    );
  };
}

export const Collapsible = { Root, Trigger, Panel };
