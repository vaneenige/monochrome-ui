"use client"

import { createContext, useContext, useId, useRef } from "react"
import type { BaseProps } from "./shared.js"

type MenuContextValue = {
  id: string
  root?: boolean
  menubar?: boolean
  submenu?: boolean
  first?: boolean
}
type MenuPopupContextValue = { claimFirst: () => boolean }

const MenuContext = createContext<MenuContextValue | null>(null)
const MenuPopupContext = createContext<MenuPopupContextValue | null>(null)

function useMenuContext() {
  const context = useContext(MenuContext)
  if (!context) throw new Error("Menu components must be used within Menu.Root")
  return context
}

function useMenuPopupContext() {
  const context = useContext(MenuPopupContext)
  if (!context) throw new Error("Menu components must be used within Menu.Popover")
  return context
}

function Root({ children, menubar, ...props }: BaseProps & { menubar?: boolean }) {
  const id = useId()
  return (
    <MenuContext.Provider value={{ id, root: true, menubar }}>
      <div {...props} id={`mcr:menu:${id}`}>
        {children}
      </div>
    </MenuContext.Provider>
  )
}

function Trigger({ children, ...props }: BaseProps) {
  const context = useMenuContext()
  return (
    <button
      {...props}
      type="button"
      id={`mct:menu:${context.id}`}
      aria-controls={`mcc:menu:${context.id}`}
      aria-expanded="false"
      aria-haspopup="menu"
      tabIndex={context.root || context.first ? 0 : -1}
      role={context.submenu ? "menuitem" : "button"}
    >
      {children}
    </button>
  )
}

function Popover({ children, ...props }: BaseProps) {
  const context = useMenuContext()
  const claimed = useRef(false)
  claimed.current = false
  const inner = (
    <MenuPopupContext.Provider
      value={{
        claimFirst: () => {
          if (!claimed.current) {
            claimed.current = true
            return true
          }
          return false
        },
      }}
    >
      {children}
    </MenuPopupContext.Provider>
  )
  return context.menubar ? (
    // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA menubar
    <ul {...props} role="menubar">
      {inner}
    </ul>
  ) : (
    <ul
      {...props}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA menu
      role="menu"
      id={`mcc:menu:${context.id}`}
      aria-labelledby={`mct:menu:${context.id}`}
      aria-hidden="true"
      popover="manual"
    >
      {inner}
    </ul>
  )
}

function Item({
  children,
  disabled,
  href,
  ...props
}: BaseProps & { disabled?: boolean; href?: string }) {
  return (
    <li role="none">
      {disabled ? (
        <span {...props} role="menuitem" aria-disabled="true" tabIndex={-1}>
          {children}
        </span>
      ) : href ? (
        <a {...props} role="menuitem" href={href} tabIndex={-1}>
          {children}
        </a>
      ) : (
        <button {...props} type="button" role="menuitem" tabIndex={-1}>
          {children}
        </button>
      )}
    </li>
  )
}

function CheckboxItem({
  children,
  checked,
  disabled,
  ...props
}: BaseProps & { checked?: boolean; disabled?: boolean }) {
  return (
    <li role="none">
      {disabled ? (
        <span
          {...props}
          role="menuitemcheckbox"
          aria-checked={checked ?? false}
          aria-disabled="true"
          tabIndex={-1}
        >
          {children}
        </span>
      ) : (
        <button
          {...props}
          type="button"
          role="menuitemcheckbox"
          aria-checked={checked ?? false}
          tabIndex={-1}
        >
          {children}
        </button>
      )}
    </li>
  )
}

function RadioItem({
  children,
  checked,
  disabled,
  ...props
}: BaseProps & { checked?: boolean; disabled?: boolean }) {
  return (
    <li role="none">
      {disabled ? (
        <span
          {...props}
          role="menuitemradio"
          aria-checked={checked ?? false}
          aria-disabled="true"
          tabIndex={-1}
        >
          {children}
        </span>
      ) : (
        <button
          {...props}
          type="button"
          role="menuitemradio"
          aria-checked={checked ?? false}
          tabIndex={-1}
        >
          {children}
        </button>
      )}
    </li>
  )
}

function Label({ children, ...props }: BaseProps) {
  return (
    <li {...props} role="presentation">
      {children}
    </li>
  )
}

function Separator(props: Omit<BaseProps, "children">) {
  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA menu separator
  // biome-ignore lint/a11y/useSemanticElements: separator must be <li> inside menu <ul>
  // biome-ignore lint/a11y/useFocusableInteractive: non-focusable separator per WAI-ARIA
  // biome-ignore lint/a11y/useAriaPropsForRole: static separator, not interactive range
  return <li {...props} role="separator" />
}

function Group({ children, ...props }: BaseProps) {
  const parentContext = useMenuContext()
  const popupContext = useMenuPopupContext()
  const isFirst = popupContext.claimFirst()
  const id = useId()
  const isFirstInMenubar = isFirst && parentContext.menubar && !parentContext.submenu
  return (
    <MenuContext.Provider value={{ id, submenu: true, first: isFirstInMenubar }}>
      <li {...props} role="none">
        {children}
      </li>
    </MenuContext.Provider>
  )
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
}
