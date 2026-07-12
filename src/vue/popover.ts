import { defineComponent, h, provide, useId } from "vue";
import { PopoverKey, requireInject } from "./shared.js";

const Root = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(PopoverKey, { id });
    return () => h("div", null, slots.default?.());
  },
});

const Trigger = defineComponent({
  props: {
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const ctx = requireInject(PopoverKey, "Popover.Trigger");
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:popover:${ctx.id}`,
          "aria-controls": `mcc:popover:${ctx.id}`,
          "aria-expanded": "false",
          "aria-disabled": props.disabled || undefined,
        },
        slots.default?.(),
      );
  },
});

const Content = defineComponent({
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    const ctx = requireInject(PopoverKey, "Popover.Content");
    return () => {
      const hasLabel = "aria-label" in attrs;
      const hasDescription = "aria-description" in attrs;
      return h(
        "div",
        {
          ...(hasLabel ? {} : { "aria-labelledby": `mct:popover:${ctx.id}` }),
          ...(hasDescription ? {} : { "aria-describedby": `mcc:popover-description:${ctx.id}` }),
          ...attrs,
          id: `mcc:popover:${ctx.id}`,
          "aria-hidden": "true",
          popover: "manual",
          tabindex: -1,
        },
        slots.default?.(),
      );
    };
  },
});

const Title = defineComponent({
  props: {
    as: { type: String, default: "h2" },
  },
  setup(props, { slots }) {
    const ctx = requireInject(PopoverKey, "Popover.Title");
    return () => h(props.as, { id: `mcc:popover-title:${ctx.id}` }, slots.default?.());
  },
});

const Description = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(PopoverKey, "Popover.Description");
    return () => h("p", { id: `mcc:popover-description:${ctx.id}` }, slots.default?.());
  },
});

export const Popover = { Root, Trigger, Content, Title, Description };
