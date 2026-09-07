import "../menu.js";
import { createContext, createElement, type ReactElement, use, useId, useRef } from "react";
import { Menu } from "./menu.js";
import { type BaseProps, MenuContext } from "./shared.js";

type MenubarClaimContextValue = { claimFirst: (id: string) => boolean };
const MenubarClaimContext = createContext<MenubarClaimContextValue | null>(null);

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
  return createElement(
    MenuContext,
    { value: { id, tabStop: claim.claimFirst(id), item: true } },
    createElement("li", { ...props, role: "none" }, children),
  );
}

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
