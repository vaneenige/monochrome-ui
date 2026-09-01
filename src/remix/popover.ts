import "../popover.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, requireContext } from "./shared.js";

type PopoverContext = { id: string };

function Root(handle: Handle<BaseProps, PopoverContext>) {
  return () => {
    const { children, ...props } = handle.props;
    handle.context.set({ id: handle.id });
    return createElement("div", props, children);
  };
}

function Trigger(handle: Handle<BaseProps & { disabled?: boolean }>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Popover.Trigger");
    const { children, disabled, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:popover:${ctx.id}`,
        "aria-controls": `mcc:popover:${ctx.id}`,
        "aria-expanded": "false",
        ...(disabled ? { "aria-disabled": "true" } : {}),
      },
      children,
    );
  };
}

function Content(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Popover.Content");
    const { children, ...props } = handle.props;
    const hasLabel = "aria-label" in props;
    const hasDescription = "aria-description" in props;
    return createElement(
      "div",
      {
        ...(hasLabel ? {} : { "aria-labelledby": `mct:popover:${ctx.id}` }),
        ...(hasDescription ? {} : { "aria-describedby": `mcc:popover-description:${ctx.id}` }),
        ...props,
        id: `mcc:popover:${ctx.id}`,
        "aria-hidden": "true",
        popover: "manual",
        tabIndex: -1,
      },
      children,
    );
  };
}

function Title(handle: Handle<BaseProps & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Popover.Title");
    const { children, as, ...props } = handle.props;
    return createElement(as ?? "h2", { ...props, id: `mcc:popover-title:${ctx.id}` }, children);
  };
}

function Description(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Popover.Description");
    const { children, ...props } = handle.props;
    return createElement("p", { ...props, id: `mcc:popover-description:${ctx.id}` }, children);
  };
}

export const Popover = { Root, Trigger, Content, Title, Description };
