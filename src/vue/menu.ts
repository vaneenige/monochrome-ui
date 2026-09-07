import "../menu.js";
import { defineComponent, h, provide, useId } from "vue";
import { MenuKey, requireInject } from "./shared.js";

const Root = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(MenuKey, { id, tabStop: true, item: false });
    return () => slots.default?.();
  },
});

const Trigger = defineComponent({
  props: {
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const ctx = requireInject(MenuKey, "Menu.Trigger");
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:menu:${ctx.id}`,
          "aria-controls": `mcc:menu:${ctx.id}`,
          "aria-expanded": "false",
          "aria-haspopup": "menu",
          tabindex: ctx.tabStop ? 0 : -1,
          role: ctx.item ? "menuitem" : "button",
          "aria-disabled": props.disabled || undefined,
        },
        slots.default?.(),
      );
  },
});

const Popover = defineComponent({
  setup(_, { slots }) {
    const ctx = requireInject(MenuKey, "Menu.Popover");
    return () =>
      h(
        "ul",
        {
          role: "menu",
          id: `mcc:menu:${ctx.id}`,
          "aria-labelledby": `mct:menu:${ctx.id}`,
          popover: "manual",
        },
        slots.default?.(),
      );
  },
});

const menuItem = (role: string, checkable: boolean) =>
  defineComponent({
    inheritAttrs: false,
    props: {
      defaultChecked: { type: Boolean, default: false },
      disabled: Boolean,
      href: String,
    },
    setup(props, { slots, attrs }) {
      return () => {
        const shared = {
          ...attrs,
          role,
          tabindex: -1,
          "aria-checked": checkable ? props.defaultChecked : undefined,
        };
        const inner = props.disabled
          ? h("span", { ...shared, "aria-disabled": "true" }, slots.default?.())
          : props.href
            ? h("a", { ...shared, href: props.href }, slots.default?.())
            : h("button", { ...shared, type: "button" }, slots.default?.());
        return h("li", { role: "none" }, [inner]);
      };
    },
  });

const Item = menuItem("menuitem", false);
const CheckboxItem = menuItem("menuitemcheckbox", true);
const RadioItem = menuItem("menuitemradio", true);

const Label = defineComponent({
  setup(_, { slots }) {
    return () => h("li", { role: "presentation" }, slots.default?.());
  },
});

const Separator = defineComponent({
  setup() {
    return () => h("li", { role: "separator" });
  },
});

const Group = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(MenuKey, { id, tabStop: false, item: true });
    return () => h("li", { role: "none" }, slots.default?.());
  },
});

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
};
