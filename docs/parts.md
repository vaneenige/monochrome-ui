# Parts

How `templates/react/*` and `templates/vue/*` work beyond
generating markup. These are the files `npx monochrome add` copies
into projects, and the React and Vue fixtures render them through
`@/components/ui`. The package has no framework export. The React
parts are described first; the Vue parts mirror them (see the end).

**Markup and initial values only.** Each part imports its own
core (`monochrome/<component>`), renders elements, and holds no
state and no handlers. `defaultOpen`, `defaultChecked`, and
`defaultValue` seed the first render; after that the core owns
the attribute. React writes a prop to the DOM only when its value
changes, and a part passes the same initial value on every
render, so a re-render leaves what the core wrote alone. An
author who changes a `default*` prop writes it again.

**One `useRow` for every menu item.** Menu's `Item`, `CheckboxItem`,
and `RadioItem` are named functions over one `useRow(role, props)`
helper. It renders the `li role="none"` and one element in it:
a `span` with `aria-disabled` when `disabled`, an `a` when `href`
is set, otherwise a button. A disabled link therefore loses its
`href`, so a pointer click cannot follow it, and every disabled
part (items, triggers, tabs) drops `onClick`: `aria-disabled`
leaves the element clickable, and the core skipping it does not
stop React's handler. `keepOpen` writes
`data-mc-keep-open` as an empty string or not at all: React
renders a `false` data attribute as `"false"`, which the core
would read as present.

**`Menu.Group` names itself; `Menu.Sub` scopes a submenu.**
`Group` renders the `li role="none"` and the `ul role="group"`,
and with a `label` it renders a `Menu.Label` first, with a
`useId` id, and points the list's `aria-labelledby` at it. The
link sits before the props spread, so an author's
`aria-labelledby` wins; without a `label` the list has none, and
`aria-label` names it. The label goes through `Menu.Label` rather
than an inline `li` so a theme adapter merges only the label's own
`className` into it, not the group's. `Group` adds no context:
its items are the enclosing menu's. `Sub` is the context scope
that turns the `Trigger` inside it into a submenu item (`item`
true) with its own `useId`.

**The menubar's first tab stop is authored.** A menubar carries
exactly one `tabindex="0"`, on the item Tab should first land
on, and the parts never work out which one that is.
`Menubar.Trigger` and `Menubar.Item` default to `-1`, a
standalone `Menu.Trigger` defaults to `0`, and a `tabIndex` the
author passes to any of them wins: it is taken off the props and
applied after them, while the id, role, and aria attributes stay
the part's. This is the contract plain HTML already has, so one
menubar reads the same in both. From then on the core moves the
stop to whichever bar item takes focus (see `docs/menu.md`,
"Moving tab stop"), as Tabs does for the selected tab, and a
re-render leaves the moved stop alone (see "Markup and initial
values only"). The cost of an authored contract is that a bar
whose items are all `-1` has no tab stop and is skipped by Tab
entirely. Nothing warns about it.

**Menubar reuses the Menu parts.** `Menubar.Root` and
`Menubar.Menu` provide the Menu context themselves (`item` true),
so `Menubar.Trigger`, `Menubar.Popover`, `Menubar.Sub`, and the
items are Menu's own parts: a trigger renders `role="menuitem"`
because `item` is set. There is no menubar-specific context.

**Default roles yield to props.** `Popover.Content` renders
`role="dialog"` before the props spread, so a `role` the author
passes replaces it (a popover that holds a listbox, say). The name
and description links on popover and dialog content step aside the
same way for `aria-label` and `aria-description`, and
`aria-describedby={undefined}` removes the description link when
there is no Description. `Collapsible.Panel` writes
`aria-labelledby` only when the author passes `role="region"`; an
`Accordion.Panel` is always a region, so its role comes after the
spread. Ids and the attributes the core reads come after the
spread and stay the part's.

**The Vue parts mirror the React parts.** Each component is a
folder: one single-file component per part, a `context.ts` with the
injection key and the `use*` helper that throws outside the root,
and an `index.ts` that imports the core and names the parts as one
object (`Menu.Root`), so a template writes `<Menu.Root>` as React
writes `<Menu.Root>`. Every part sets `inheritAttrs: false` and binds
`$attrs` before its own attributes, the order of React's
spread-then-fixed props, so the ids, roles, and ARIA links a part
writes win and the defaults written before `$attrs` (Popover's
`role`, the `aria-labelledby` and `aria-describedby` links) yield.
A disabled part binds its attributes without `onClick`, as the React
part drops the prop. Menu's three item parts render one `Row.vue`,
as React's share `useRow`. Boolean props default to `false`, except
`defaultSelected`, which defaults to `undefined` so a tab without it
falls back to the root's `defaultValue`. Vue patches an attribute
only when its bound value changes, and a part binds the same
initial value on every render, so, as in React, a re-render leaves
what the core wrote alone. Vue writes `false` as the string
`"false"` and drops `undefined`, which is what `aria-expanded` and
`aria-disabled` need.
