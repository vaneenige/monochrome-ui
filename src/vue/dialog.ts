import "../dialog.js";
import { defineComponent, h, provide, useId } from "vue";
import { DialogKey, requireInject } from "./shared.js";

const Root = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(DialogKey, { id });
    return () => h("div", null, slots.default?.());
  },
});

const Trigger = defineComponent({
  props: {
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const ctx = requireInject(DialogKey, "Dialog.Trigger");
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:dialog-open:${ctx.id}`,
          "aria-haspopup": "dialog",
          "aria-controls": `mcc:dialog:${ctx.id}`,
          "aria-disabled": props.disabled || undefined,
        },
        slots.default?.(),
      );
  },
});

const Content = defineComponent({
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    const ctx = requireInject(DialogKey, "Dialog.Content");
    return () => {
      const hasLabel = "aria-label" in attrs;
      const hasDescription = "aria-description" in attrs;
      return h(
        "dialog",
        {
          ...(hasLabel ? {} : { "aria-labelledby": `mcc:dialog-title:${ctx.id}` }),
          ...(hasDescription ? {} : { "aria-describedby": `mcc:dialog-description:${ctx.id}` }),
          ...attrs,
          id: `mcc:dialog:${ctx.id}`,
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
    const ctx = requireInject(DialogKey, "Dialog.Title");
    return () => h(props.as, { id: `mcc:dialog-title:${ctx.id}` }, slots.default?.());
  },
});

const Description = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(DialogKey, "Dialog.Description");
    return () => h("p", { id: `mcc:dialog-description:${ctx.id}` }, slots.default?.());
  },
});

const Close = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(DialogKey, "Dialog.Close");
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:dialog-close:${ctx.id}`,
        },
        slots.default?.(),
      );
  },
});

export const Dialog = { Root, Trigger, Content, Title, Description, Close };
