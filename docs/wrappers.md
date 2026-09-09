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

**Menubar tab-stop claim.** The first `Menubar.Menu` claims
`tabindex=0`; every other trigger gets `-1` and is reached via
arrow keys. Bare `Menubar.Item`s must come after the first
`Menubar.Menu`, or initial tab focus lands past the visually
first item. React keys the claim by the claimer's id so a Menu
that re-renders alone re-claims its slot, and StrictMode
double-render agrees. Root resets the claim during render because
a children change re-renders Root, and the next pass re-claims in
document order. Vue holds the claimer id in a ref: claiming is
idempotent per id, unmounting releases, and each Menu tracks the
ref through a `watchEffect` so the earliest surviving Menu
becomes the tab stop.

**Menubar reuses the Menu context.** `Menubar.Menu` provides the
Menu context itself (`tabStop` from the claim, `item` true), so
`Menubar.Trigger`, `Menubar.Popover`, and `Menubar.Group` are
`Menu.Trigger`, `Menu.Popover`, and `Menu.Group`. There is no
menubar-specific slot context.
