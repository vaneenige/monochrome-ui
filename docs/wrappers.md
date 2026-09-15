# React and Vue wrappers

How `src/react/*` and `src/vue/*` work beyond generating markup.

**`createElement` / `h`, not JSX / SFC.** Wrappers call
`createElement` and `h` instead of JSX and SFCs. That eliminates
`react/jsx-runtime` from the React bundle and halves the Vue
bundle (no SFC patch-flag machinery). Source stays
framework-agnostic in style.

**One `menuItem` factory.** Menu's Item, CheckboxItem, and
RadioItem come from one `menuItem(role, checkable)` factory in
both wrappers. Its React product is a named function expression,
so all three trace as `MenuItem` in stack traces and devtools.

**The menubar tab stop is authored.** A menubar carries exactly
one `tabindex="0"`, on the item Tab should land on, and the
wrappers never work out which one that is. `Menubar.Trigger` and
`Menubar.Item` default to `-1`, a standalone `Menu.Trigger`
defaults to `0`, and a `tabIndex` the author passes to any of
them wins: it is taken off the props and applied after them, so
the id, role, and aria attributes stay the wrapper's. This is
the contract plain HTML already has, so one menubar reads the
same in all three renderers, and it is the only one the core can
honour: unlike Tabs, `src/menu.ts` never writes `tabindex`, so
the markup is what the bar does for its whole life. The cost is
that a bar whose items are all `-1` has no tab stop and is
skipped by Tab entirely. Nothing warns about it.

**Menubar reuses the Menu context.** `Menubar.Menu` provides the
Menu context itself (`item` true), so `Menubar.Trigger`,
`Menubar.Popover`, and `Menubar.Group` are `Menu.Trigger`,
`Menu.Popover`, and `Menu.Group`. There is no menubar-specific
slot context.
