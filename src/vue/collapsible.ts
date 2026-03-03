import { defineComponent, h, provide, reactive, toRef, useId } from "vue"
import { CollapsibleKey, HiddenUntilFound, requireInject } from "./shared.js"

const Root = defineComponent({
  props: {
    open: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
    const baseId = useId()
    provide(CollapsibleKey, reactive({ baseId, open: toRef(props, "open") }))
    return () => h("div", null, slots.default?.())
  },
})

const Trigger = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(CollapsibleKey, "Collapsible.Trigger/Panel")
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:collapsible:${ctx.baseId}`,
          "aria-expanded": ctx.open,
          "aria-controls": `mcc:collapsible:${ctx.baseId}`,
        },
        slots.default?.(),
      )
  },
})

const Panel = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(CollapsibleKey, "Collapsible.Trigger/Panel")
    return () =>
      h(
        "div",
        {
          id: `mcc:collapsible:${ctx.baseId}`,
          "aria-labelledby": `mct:collapsible:${ctx.baseId}`,
          "aria-hidden": !ctx.open,
          hidden: ctx.open ? undefined : true,
        },
        [!ctx.open && h(HiddenUntilFound), slots.default?.()],
      )
  },
})

export const Collapsible = { Root, Trigger, Panel }
