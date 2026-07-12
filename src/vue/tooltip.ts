import { defineComponent, h, provide, useId } from "vue";
import { requireInject, TooltipKey } from "./shared.js";

const Root = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(TooltipKey, { id });
    return () => h("div", null, slots.default?.());
  },
});

const Trigger = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(TooltipKey, "Tooltip.Trigger");
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:tooltip:${ctx.id}`,
          "aria-describedby": `mcc:tooltip:${ctx.id}`,
        },
        slots.default?.(),
      );
  },
});

const Content = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(TooltipKey, "Tooltip.Content");
    return () =>
      h(
        "div",
        {
          id: `mcc:tooltip:${ctx.id}`,
          role: "tooltip",
          popover: "manual",
        },
        slots.default?.(),
      );
  },
});

export const Tooltip = { Root, Trigger, Content };
