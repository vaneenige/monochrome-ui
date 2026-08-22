import "../menu.js";
import { createContext, createElement, type ReactElement, use, useId, useRef } from "react";
import { Menu } from "./menu.js";
import type { BaseProps } from "./shared.js";

type MenubarSlotContextValue = {
  id: string;
  first: boolean;
};
type MenubarClaimContextValue = { claimFirst: (id: string) => boolean };

const MenubarSlotContext = createContext<MenubarSlotContextValue | null>(null);
const MenubarClaimContext = createContext<MenubarClaimContextValue | null>(null);

function useMenubarSlot() {
  const ctx = use(MenubarSlotContext);
  if (!ctx)
    throw new Error(
      "Menubar.Trigger and Menubar.Popover must be used within Menubar.Menu or Menubar.Group",
    );
  return ctx;
}

function useMenubarClaim() {
  const ctx = use(MenubarClaimContext);
  if (!ctx) throw new Error("Menubar.Menu must be used within Menubar.Root");
  return ctx;
}

function Root({ children, ...props }: BaseProps): ReactElement {
  const claimed = useRef<string | null>(null);
  claimed.current = null;
  return createElement(
    MenubarClaimContext,
    {
      value: {
        claimFirst: (id: string) => {
          if (claimed.current === null || claimed.current === id) {
            claimed.current = id;
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
  const id = useId();
  const isFirst = claim.claimFirst(id);
  return createElement(
    MenubarSlotContext,
    { value: { id, first: isFirst } },
    createElement("li", { ...props, role: "none" }, children),
  );
}

function Group({ children, ...props }: BaseProps): ReactElement {
  const id = useId();
  return createElement(
    MenubarSlotContext,
    { value: { id, first: false } },
    createElement("li", { ...props, role: "none" }, children),
  );
}

function Trigger({
  children,
  disabled,
  ...props
}: BaseProps & { disabled?: boolean }): ReactElement {
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
      ...(disabled ? { "aria-disabled": "true" } : {}),
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
