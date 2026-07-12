import { defineComponent, h, onUnmounted, provide, reactive, ref, useId, watchEffect } from "vue";
import { Menu } from "./menu.js";
import { MenubarClaimKey, MenubarSlotKey, requireInject } from "./shared.js";

// The first `Menubar.Menu` claims the keyboard tab-stop (`tabindex=0`);
// every other trigger gets `-1` and is reached via arrow keys. Put any
// bare `Menubar.Item`s after the first `Menubar.Menu`, otherwise the
// initial tab focus lands past the visually-first item.
//
// The claim is a ref holding the claimer's id. Claiming is idempotent
// per id, unmounting releases, and each Menu tracks the ref through a
// `watchEffect`, so when the claimer leaves the earliest surviving
// Menu re-claims and its trigger becomes the tab stop reactively.
const Root = defineComponent({
  setup(_, { slots }) {
    const claimed = ref<string | null>(null);
    provide(MenubarClaimKey, {
      claimFirst: (id: string) => {
        if (claimed.value === null || claimed.value === id) {
          claimed.value = id;
          return true;
        }
        return false;
      },
      release: (id: string) => {
        if (claimed.value === id) claimed.value = null;
      },
    });
    return () => h("ul", { role: "menubar" }, slots.default?.());
  },
});

const MenubarMenu = defineComponent({
  setup(_, { slots }) {
    const claim = requireInject(MenubarClaimKey, "Menubar.Menu");
    const id = useId();
    const first = ref(false);
    watchEffect(() => {
      first.value = claim.claimFirst(id);
    });
    onUnmounted(() => claim.release(id));
    provide(MenubarSlotKey, reactive({ id, first }));
    return () => h("li", { role: "none" }, slots.default?.());
  },
});

const Group = defineComponent({
  setup(_, { slots }) {
    const id = useId();
    provide(MenubarSlotKey, { id, first: false });
    return () => h("li", { role: "none" }, slots.default?.());
  },
});

const Trigger = defineComponent({
  props: {
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const slot = requireInject(MenubarSlotKey, "Menubar.Trigger");
    return () =>
      h(
        "button",
        {
          type: "button",
          id: `mct:menu:${slot.id}`,
          "aria-controls": `mcc:menu:${slot.id}`,
          "aria-expanded": "false",
          "aria-haspopup": "menu",
          tabindex: slot.first ? 0 : -1,
          role: "menuitem",
          "aria-disabled": props.disabled || undefined,
        },
        slots.default?.(),
      );
  },
});

const Popover = defineComponent({
  setup(_, { slots }) {
    const slot = requireInject(MenubarSlotKey, "Menubar.Popover");
    return () =>
      h(
        "ul",
        {
          role: "menu",
          id: `mcc:menu:${slot.id}`,
          "aria-labelledby": `mct:menu:${slot.id}`,
          "aria-hidden": "true",
          popover: "manual",
        },
        slots.default?.(),
      );
  },
});

export const Menubar = {
  Root,
  Menu: MenubarMenu,
  Group,
  Trigger,
  Popover,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  RadioItem: Menu.RadioItem,
  Label: Menu.Label,
  Separator: Menu.Separator,
};
