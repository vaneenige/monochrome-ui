import "../menu.js";
import { defineComponent, h, onUnmounted, provide, reactive, ref, useId, watchEffect } from "vue";
import { Menu } from "./menu.js";
import { MenubarClaimKey, MenuKey, requireInject } from "./shared.js";

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
    const tabStop = ref(false);
    watchEffect(() => {
      tabStop.value = claim.claimFirst(id);
    });
    onUnmounted(() => claim.release(id));
    provide(MenuKey, reactive({ id, tabStop, item: true }));
    return () => h("li", { role: "none" }, slots.default?.());
  },
});

export const Menubar = {
  Root,
  Menu: MenubarMenu,
  Group: Menu.Group,
  Trigger: Menu.Trigger,
  Popover: Menu.Popover,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  RadioItem: Menu.RadioItem,
  Label: Menu.Label,
  Separator: Menu.Separator,
};
