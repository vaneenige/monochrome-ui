import {
	createContext,
	createElement,
	type ReactElement,
	useContext,
	useId,
	useRef,
} from "react";
import { Menu } from "./menu.js";
import type { BaseProps } from "./shared.js";

type MenubarSlotContextValue = {
	id: string;
	first: boolean;
};
type MenubarClaimContextValue = { claimFirst: () => boolean };

const MenubarSlotContext = createContext<MenubarSlotContextValue | null>(null);
const MenubarClaimContext = createContext<MenubarClaimContextValue | null>(
	null,
);

function useMenubarSlot() {
	const ctx = useContext(MenubarSlotContext);
	if (!ctx)
		throw new Error(
			"Menubar.Trigger and Menubar.Popover must be used within Menubar.Menu or Menubar.Group",
		);
	return ctx;
}

function useMenubarClaim() {
	const ctx = useContext(MenubarClaimContext);
	if (!ctx) throw new Error("Menubar.Menu must be used within Menubar.Root");
	return ctx;
}

// The first `Menubar.Menu` claims the keyboard tab-stop (`tabindex=0`);
// every other trigger gets `-1` and is reached via arrow keys. Put any
// bare `Menubar.Item`s after the first `Menubar.Menu`, otherwise the
// initial tab focus lands past the visually-first item.
function Root({ children, ...props }: BaseProps): ReactElement {
	const claimed = useRef(false);
	claimed.current = false;
	return createElement(
		MenubarClaimContext.Provider,
		{
			value: {
				claimFirst: () => {
					if (!claimed.current) {
						claimed.current = true;
						return true;
					}
					return false;
				},
			},
		},
		createElement("ul", { ...props, role: "menubar" }, children),
	);
}

function MenubarMenu({ children, ...props }: BaseProps): ReactElement {
	const claim = useMenubarClaim();
	const isFirst = claim.claimFirst();
	const id = useId();
	return createElement(
		MenubarSlotContext.Provider,
		{ value: { id, first: isFirst } },
		createElement("li", { ...props, role: "none" }, children),
	);
}

function Group({ children, ...props }: BaseProps): ReactElement {
	const id = useId();
	return createElement(
		MenubarSlotContext.Provider,
		{ value: { id, first: false } },
		createElement("li", { ...props, role: "none" }, children),
	);
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
	const slot = useMenubarSlot();
	return createElement(
		"button",
		{
			...props,
			type: "button",
			id: `mct:menu:${slot.id}`,
			"aria-controls": `mcc:menu:${slot.id}`,
			"aria-expanded": "false",
			"aria-haspopup": "menu",
			tabIndex: slot.first ? 0 : -1,
			role: "menuitem",
		},
		children,
	);
}

function Popover({ children, ...props }: BaseProps): ReactElement {
	const slot = useMenubarSlot();
	return createElement(
		"ul",
		{
			...props,
			role: "menu",
			id: `mcc:menu:${slot.id}`,
			"aria-labelledby": `mct:menu:${slot.id}`,
			"aria-hidden": "true",
			popover: "manual",
		},
		children,
	);
}

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
