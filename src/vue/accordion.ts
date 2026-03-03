import { defineComponent, h, provide, reactive, toRef, useId } from "vue"
import { AccordionKey, HiddenUntilFound, requireInject } from "./shared.js"

const Root = defineComponent({
  props: {
    type: { type: String, default: "single" },
  },
  setup(props, { slots }) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
    const id = useId()
    return () => h("div", { "data-mode": props.type, id: `mcr:accordion:${id}` }, slots.default?.())
  },
})

const Item = defineComponent({
  props: {
    open: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
    const baseId = useId()
    provide(
      AccordionKey,
      reactive({ baseId, open: toRef(props, "open"), disabled: toRef(props, "disabled") }),
    )
    return () => h("div", null, slots.default?.())
  },
})

const Header = defineComponent({
  props: {
    as: { type: String, default: "h3" },
  },
  setup(props, { slots }) {
    return () => h(props.as, null, slots.default?.())
  },
})

const Trigger = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(AccordionKey, "Accordion.Trigger/Panel")
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:accordion:${ctx.baseId}`,
          "aria-expanded": ctx.open,
          "aria-controls": `mcc:accordion:${ctx.baseId}`,
          "aria-disabled": ctx.disabled || undefined,
        },
        slots.default?.(),
      )
  },
})

const Panel = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(AccordionKey, "Accordion.Trigger/Panel")
    return () =>
      h(
        "div",
        {
          id: `mcc:accordion:${ctx.baseId}`,
          role: "region",
          "aria-labelledby": `mct:accordion:${ctx.baseId}`,
          "aria-hidden": !ctx.open,
          hidden: ctx.open ? undefined : true,
        },
        [!ctx.open && h(HiddenUntilFound), slots.default?.()],
      )
  },
})

export const Accordion = { Root, Item, Header, Trigger, Panel }
