import "../dialog.js";
import { createElement, type Handle } from "remix/ui";
import { type BaseProps, requireContext } from "./shared.js";

type DialogContext = { id: string };

function Root(handle: Handle<BaseProps, DialogContext>) {
  return () => {
    const { children, ...props } = handle.props;
    handle.context.set({ id: handle.id });
    return createElement("div", props, children);
  };
}

function Trigger(handle: Handle<BaseProps & { disabled?: boolean }>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Dialog.Trigger");
    const { children, disabled, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:dialog-open:${ctx.id}`,
        "aria-haspopup": "dialog",
        "aria-controls": `mcc:dialog:${ctx.id}`,
        ...(disabled ? { "aria-disabled": "true" } : {}),
      },
      children,
    );
  };
}

function Content(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Dialog.Content");
    const { children, ...props } = handle.props;
    const hasLabel = "aria-label" in props;
    const hasDescription = "aria-description" in props;
    return createElement(
      "dialog",
      {
        ...(hasLabel ? {} : { "aria-labelledby": `mcc:dialog-title:${ctx.id}` }),
        ...(hasDescription ? {} : { "aria-describedby": `mcc:dialog-description:${ctx.id}` }),
        ...props,
        id: `mcc:dialog:${ctx.id}`,
        tabIndex: -1,
      },
      children,
    );
  };
}

function Title(handle: Handle<BaseProps & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Dialog.Title");
    const { children, as, ...props } = handle.props;
    return createElement(as ?? "h2", { ...props, id: `mcc:dialog-title:${ctx.id}` }, children);
  };
}

function Description(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Dialog.Description");
    const { children, ...props } = handle.props;
    return createElement("p", { ...props, id: `mcc:dialog-description:${ctx.id}` }, children);
  };
}

function Close(handle: Handle<BaseProps>) {
  return () => {
    const ctx = requireContext(handle.context.get(Root), "Dialog.Close");
    const { children, ...props } = handle.props;
    return createElement(
      "button",
      {
        ...props,
        type: "button",
        id: `mct:dialog-close:${ctx.id}`,
      },
      children,
    );
  };
}

export const Dialog = { Root, Trigger, Content, Title, Description, Close };
