import {
	createContext,
	createElement,
	type ReactElement,
	type ReactNode,
	useContext,
	useId,
} from "react";
import type { BaseProps } from "./shared.js";

type MenuContextValue = {
	id: string;
	root?: boolean;
	submenu?: boolean;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
	const context = useContext(MenuContext);
	if (!context)
		throw new Error("Menu components must be used within Menu.Root");
	return context;
}

function Root({ children }: { children: ReactNode }): ReactElement {
	const id = useId();
	return createElement(
		MenuContext.Provider,
		{ value: { id, root: true } },
		children,
	);
}

function Trigger({
	children,
	disabled,
	...props
}: BaseProps & { disabled?: boolean }): ReactElement {
	const context = useMenuContext();
	return createElement(
		"button",
		{
			...props,
			type: "button",
			id: `mct:menu:${context.id}`,
			"aria-controls": `mcc:menu:${context.id}`,
			"aria-expanded": "false",
			"aria-haspopup": "menu",
			tabIndex: context.root ? 0 : -1,
			role: context.submenu ? "menuitem" : "button",
			...(disabled ? { "aria-disabled": "true" } : {}),
		},
		children,
	);
}

function Popover({ children, ...props }: BaseProps): ReactElement {
	const context = useMenuContext();
	return createElement(
		"ul",
		{
			...props,
			role: "menu",
			id: `mcc:menu:${context.id}`,
			"aria-labelledby": `mct:menu:${context.id}`,
			"aria-hidden": "true",
			popover: "manual",
		},
		children,
	);
}

function Item({
	children,
	disabled,
	href,
	...props
}: BaseProps & { disabled?: boolean; href?: string }): ReactElement {
	const inner = disabled
		? createElement(
				"span",
				{ ...props, role: "menuitem", "aria-disabled": "true", tabIndex: -1 },
				children,
			)
		: href
			? createElement(
					"a",
					{ ...props, role: "menuitem", href, tabIndex: -1 },
					children,
				)
			: createElement(
					"button",
					{ ...props, type: "button", role: "menuitem", tabIndex: -1 },
					children,
				);
	return createElement("li", { role: "none" }, inner);
}

function CheckboxItem({
	children,
	checked,
	disabled,
	...props
}: BaseProps & { checked?: boolean; disabled?: boolean }): ReactElement {
	const inner = disabled
		? createElement(
				"span",
				{
					...props,
					role: "menuitemcheckbox",
					"aria-checked": checked ?? false,
					"aria-disabled": "true",
					tabIndex: -1,
				},
				children,
			)
		: createElement(
				"button",
				{
					...props,
					type: "button",
					role: "menuitemcheckbox",
					"aria-checked": checked ?? false,
					tabIndex: -1,
				},
				children,
			);
	return createElement("li", { role: "none" }, inner);
}

function RadioItem({
	children,
	checked,
	disabled,
	...props
}: BaseProps & { checked?: boolean; disabled?: boolean }): ReactElement {
	const inner = disabled
		? createElement(
				"span",
				{
					...props,
					role: "menuitemradio",
					"aria-checked": checked ?? false,
					"aria-disabled": "true",
					tabIndex: -1,
				},
				children,
			)
		: createElement(
				"button",
				{
					...props,
					type: "button",
					role: "menuitemradio",
					"aria-checked": checked ?? false,
					tabIndex: -1,
				},
				children,
			);
	return createElement("li", { role: "none" }, inner);
}

function Label({ children, ...props }: BaseProps): ReactElement {
	return createElement("li", { ...props, role: "presentation" }, children);
}

function Separator(props: Omit<BaseProps, "children">): ReactElement {
	return createElement("li", { ...props, role: "separator" });
}

function Group({ children, ...props }: BaseProps): ReactElement {
	const id = useId();
	return createElement(
		MenuContext.Provider,
		{ value: { id, submenu: true } },
		createElement("li", { ...props, role: "none" }, children),
	);
}

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
