import { defineComponent, h, provide, useId } from "vue";
import { PopoverKey, requireInject } from "./shared.js";

const Root = defineComponent({
	setup(_, { slots }) {
		// biome-ignore lint/correctness/useHookAtTopLevel: Vue useId, not React
		const id = useId();
		provide(PopoverKey, { id });
		return () => h("div", null, slots.default?.());
	},
});

const Trigger = defineComponent({
	setup(_, { slots }) {
		const ctx = requireInject(PopoverKey, "Popover.Trigger");
		return () =>
			h(
				"button",
				{
					type: "button",
					id: `mct:popover:${ctx.id}`,
					"aria-controls": `mcc:popover:${ctx.id}`,
					"aria-expanded": "false",
				},
				slots.default?.(),
			);
	},
});

const Content = defineComponent({
	setup(_, { slots }) {
		const ctx = requireInject(PopoverKey, "Popover.Content");
		return () =>
			h(
				"div",
				{
					id: `mcc:popover:${ctx.id}`,
					"aria-labelledby": `mct:popover:${ctx.id}`,
					"aria-hidden": "true",
					popover: "manual",
					tabindex: -1,
				},
				slots.default?.(),
			);
	},
});

export const Popover = { Root, Trigger, Content };
