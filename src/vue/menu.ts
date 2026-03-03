import { defineComponent, h, onBeforeUpdate, provide, reactive, ref, toRef, useId } from "vue"
import { MenuKey, MenuPopupKey, requireInject } from "./shared.js"

const Root = defineComponent({
  props: {
    menubar: Boolean,
  },
  setup(props, { slots }) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
    const id = useId()
    provide(MenuKey, reactive({ id, root: true, menubar: toRef(props, "menubar") }))
    return () => h("div", { id: `mcr:menu:${id}` }, slots.default?.())
  },
})

const Trigger = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(MenuKey, "Menu.Trigger")
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:menu:${ctx.id}`,
          "aria-controls": `mcc:menu:${ctx.id}`,
          "aria-expanded": "false",
          "aria-haspopup": "menu",
          tabindex: ctx.root || ctx.first ? 0 : -1,
          role: ctx.submenu ? "menuitem" : "button",
        },
        slots.default?.(),
      )
  },
})

const Popover = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(MenuKey, "Menu.Popover")
    const claimed = ref(false)
    onBeforeUpdate(() => {
      claimed.value = false
    })
    provide(MenuPopupKey, {
      claimFirst: () => {
        if (!claimed.value) {
          claimed.value = true
          return true
        }
        return false
      },
    })
    return () =>
      ctx.menubar
        ? h("ul", { role: "menubar" }, slots.default?.())
        : h(
            "ul",
            {
              role: "menu",
              id: `mcc:menu:${ctx.id}`,
              "aria-labelledby": `mct:menu:${ctx.id}`,
              "aria-hidden": "true",
              popover: "manual",
            },
            slots.default?.(),
          )
  },
})

const Item = defineComponent({
  inheritAttrs: false,
  props: {
    disabled: Boolean,
    href: String,
  },
  setup(props, { slots, attrs }) {
    return () => {
      const inner = props.disabled
        ? h(
            "span",
            { ...attrs, role: "menuitem", "aria-disabled": "true", tabindex: -1 },
            slots.default?.(),
          )
        : props.href
          ? h(
              "a",
              { ...attrs, role: "menuitem", href: props.href, tabindex: -1 },
              slots.default?.(),
            )
          : h(
              "button",
              { ...attrs, type: "button", role: "menuitem", tabindex: -1 },
              slots.default?.(),
            )
      return h("li", { role: "none" }, [inner])
    }
  },
})

const CheckboxItem = defineComponent({
  inheritAttrs: false,
  props: {
    checked: { type: Boolean, default: false },
    disabled: Boolean,
  },
  setup(props, { slots, attrs }) {
    return () => {
      const inner = props.disabled
        ? h(
            "span",
            {
              ...attrs,
              role: "menuitemcheckbox",
              "aria-checked": props.checked,
              "aria-disabled": "true",
              tabindex: -1,
            },
            slots.default?.(),
          )
        : h(
            "button",
            {
              ...attrs,
              type: "button",
              role: "menuitemcheckbox",
              "aria-checked": props.checked,
              tabindex: -1,
            },
            slots.default?.(),
          )
      return h("li", { role: "none" }, [inner])
    }
  },
})

const RadioItem = defineComponent({
  inheritAttrs: false,
  props: {
    checked: { type: Boolean, default: false },
    disabled: Boolean,
  },
  setup(props, { slots, attrs }) {
    return () => {
      const inner = props.disabled
        ? h(
            "span",
            {
              ...attrs,
              role: "menuitemradio",
              "aria-checked": props.checked,
              "aria-disabled": "true",
              tabindex: -1,
            },
            slots.default?.(),
          )
        : h(
            "button",
            {
              ...attrs,
              type: "button",
              role: "menuitemradio",
              "aria-checked": props.checked,
              tabindex: -1,
            },
            slots.default?.(),
          )
      return h("li", { role: "none" }, [inner])
    }
  },
})

const Label = defineComponent({
  setup(_, { slots }) {
    return () => h("li", { role: "presentation" }, slots.default?.())
  },
})

const Separator = defineComponent({
  setup() {
    return () => h("li", { role: "separator" })
  },
})

const Group = defineComponent({
  setup(_, { slots }) {
    const parentCtx = requireInject(MenuKey, "Menu.Group")
    const popupCtx = requireInject(MenuPopupKey, "Menu.Group")
    const isFirst = popupCtx.claimFirst()
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
    const id = useId()
    const isFirstInMenubar = isFirst && parentCtx.menubar && !parentCtx.submenu
    provide(MenuKey, { id, submenu: true, first: isFirstInMenubar })
    return () => h("li", { role: "none" }, slots.default?.())
  },
})

export const Menu = {
  Root,
  Trigger,
  Popover,
  Item,
  CheckboxItem,
  RadioItem,
  Label,
  Separator,
  Group,
}
