import { defineComponent, h, onBeforeUpdate, provide, ref, useId } from "vue";
import { Menu } from "./menu.js";
import { MenubarClaimKey, MenubarSlotKey, requireInject } from "./shared.js";

// The first `Menubar.Menu` claims the keyboard tab-stop (`tabindex=0`);
// every other trigger gets `-1` and is reached via arrow keys. Put any
// bare `Menubar.Item`s after the first `Menubar.Menu`, otherwise the
// initial tab focus lands past the visually-first item.
const Root = defineComponent({
	setup(_, { slots }) {
		const claimed = ref(false);
		onBeforeUpdate(() => {
			claimed.value = false;
		});
		provide(MenubarClaimKey, {
			claimFirst: () => {
				if (!claimed.value) {
					claimed.value = true;
					return true;
				}
				return false;
			},
		});
		return () => h("ul", { role: "menubar" }, slots.default?.());
	},
});

const MenubarMenu = defineComponent({
	setup(_, { slots }) {
		const claim = requireInject(MenubarClaimKey, "Menubar.Menu");
		const isFirst = claim.claimFirst();
		// biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
		const id = useId();
		provide(MenubarSlotKey, { id, first: isFirst });
		return () => h("li", { role: "none" }, slots.default?.());
	},
});

const Group = defineComponent({
	setup(_, { slots }) {
		// biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
		const id = useId();
		provide(MenubarSlotKey, { id, first: false });
		return () => h("li", { role: "none" }, slots.default?.());
	},
});

const Trigger = defineComponent({
	setup(_, { slots }) {
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
