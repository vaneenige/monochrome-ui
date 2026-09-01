import "../accordion.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, requireContext } from "./shared.js";

type AccordionContext = { id: string; open: boolean; disabled: boolean };

function Root(handle: Handle<BaseProps & { type?: "single" | "multiple" }>) {
  return () => {
    const { children, type, ...props } = handle.props;
    return createElement(
      "div",
      { ...props, "data-mode": type ?? "single", id: `mcr:accordion:${handle.id}` },
      children,
    );
  };
}

function Item(
  handle: Handle<BaseProps & { open?: boolean; disabled?: boolean }, AccordionContext>,
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

function Header(handle: Handle<BaseProps & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }>) {
  return () => {
    const { children, as, ...props } = handle.props;
    return createElement(as ?? "h3", props, children);
  };
}

function Trigger(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Item), "Accordion.Trigger");
    const { children, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:accordion:${ctx.id}`,
        "aria-expanded": ctx.open ? "true" : "false",
        "aria-controls": `mcc:accordion:${ctx.id}`,
        "aria-disabled": ctx.disabled ? "true" : undefined,
      },
      children,
    );
  };
}

function Panel(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Item), "Accordion.Panel");
    const { children, ...props } = handle.props;
    return createElement(
      "div",
      {
        ...props,
        id: `mcc:accordion:${ctx.id}`,
        role: "region",
        "aria-labelledby": `mct:accordion:${ctx.id}`,
        "aria-hidden": ctx.open ? "false" : "true",
        hidden: ctx.open ? undefined : true,
      },
      children,
    );
  };
}

export const Accordion = { Root, Item, Header, Trigger, Panel };
