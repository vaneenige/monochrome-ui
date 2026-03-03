import type { PropType } from "vue"
import { computed, defineComponent, h, provide, reactive, toRef, useId } from "vue"
import { buildId, HiddenUntilFound, requireInject, TabsKey } from "./shared.js"

const Root = defineComponent({
  props: {
    defaultValue: { type: String, required: true },
    orientation: { type: String as () => "horizontal" | "vertical", default: "horizontal" },
  },
  setup(props, { slots }) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
    const baseId = useId()
    provide(
      TabsKey,
      reactive({ baseId, selected: props.defaultValue, orientation: toRef(props, "orientation") }),
    )
    return () =>
      h(
        "div",
        { "data-orientation": props.orientation, id: `mcr:tabs:${baseId}` },
        slots.default?.(),
      )
  },
})

const List = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(TabsKey, "Tabs.List/Tab/Panel")
    return () =>
      h("div", { role: "tablist", "aria-orientation": ctx.orientation }, slots.default?.())
  },
})

const Tab = defineComponent({
  props: {
    value: { type: String, required: true },
    selected: { type: [Boolean, null] as PropType<boolean | null>, default: null },
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const ctx = requireInject(TabsKey, "Tabs.List/Tab/Panel")
    const fullId = computed(() => buildId(ctx.baseId, props.value))
    const isSelected = computed(() =>
      props.selected !== null ? props.selected : props.value === ctx.selected,
    )
    return () =>
      h(
        "button",
        {
          type: "button",
          role: "tab",
          id: `mct:tabs:${fullId.value}`,
          "aria-selected": isSelected.value,
          "aria-controls": `mcc:tabs:${fullId.value}`,
          tabindex: isSelected.value ? 0 : -1,
          "aria-disabled": props.disabled || undefined,
        },
        slots.default?.(),
      )
  },
})

const Panel = defineComponent({
  props: {
    value: { type: String, required: true },
    selected: { type: [Boolean, null] as PropType<boolean | null>, default: null },
    focusable: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const ctx = requireInject(TabsKey, "Tabs.List/Tab/Panel")
    const fullId = computed(() => buildId(ctx.baseId, props.value))
    const isSelected = computed(() =>
      props.selected !== null ? props.selected : props.value === ctx.selected,
    )
    return () =>
      h(
        "div",
        {
          role: "tabpanel",
          id: `mcc:tabs:${fullId.value}`,
          "aria-labelledby": `mct:tabs:${fullId.value}`,
          "aria-hidden": !isSelected.value,
          hidden: isSelected.value ? undefined : true,
          tabindex: props.focusable ? (isSelected.value ? 0 : -1) : undefined,
          "data-orientation": ctx.orientation,
        },
        [!isSelected.value && h(HiddenUntilFound), slots.default?.()],
      )
  },
})

export const Tabs = { Root, List, Tab, Panel }
