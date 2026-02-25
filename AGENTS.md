# Monochrome - Agent Guide

This file helps AI agents (Claude, Cursor, Copilot, etc.) understand how to use and work with the monochrome library.

## Overview

Monochrome is an accessible UI component library providing four components: **Accordion**, **Collapsible**, **Menu**, and **Tabs**. The library ships as two packages:

- **Core** (`monochrome`) - A single ~2KB gzipped JavaScript file with zero dependencies. Uses event delegation and ARIA attributes as the source of truth. No per-component initialization, no state objects, no framework dependency. Import it once and all components on the page work automatically.
- **React wrappers** (`monochrome/react`) - Compound components that render the correct HTML structure and ARIA attributes for the core to operate on. These are raw TypeScript source files (not compiled) — consumers import them directly and their bundler compiles them.

## Development

```bash
bun install            # Install dependencies
bun build.ts           # Build core to dist/, update README badges
bun test               # Run all Playwright tests
bun run lint           # Biome lint check
bun run lint:fix       # Biome lint auto-fix
bun run format         # Biome format
```

**Biome config:** 2-space indent, 100-char line width, double quotes, semicolons as needed (omitted unless required by ASI), recommended lint rules.

## Design Principles

1. **DOM is the source of truth** - The core reads ARIA attributes (`aria-expanded`, `aria-selected`, `aria-controls`) to determine state. No internal state objects.
2. **Event delegation** - Six global listeners (`click`, `pointermove`, `keydown`, `scroll`, `resize`, `beforematch`) handle all component behavior. Adding 1000 components costs zero additional runtime.
3. **Zero timers, zero delays** - All behavior is synchronous and immediate. No `setTimeout`, no `requestAnimationFrame`, no debounce. The safety triangle uses velocity-based intent detection instead of timers.
4. **ID conventions drive behavior** - The core identifies elements by ID prefix, not by class, data attribute, or DOM query.
5. **`hidden="until-found"`** - Hidden content uses `hidden="until-found"` (never `display: none`) to preserve browser find-in-page (Ctrl+F / Cmd+F).

## Browser Requirements

The core depends on modern browser APIs:

- **Popover API** — `showPopover()` / `hidePopover()`, `popover="manual"` for menu positioning
- **`hidden="until-found"`** — preserves browser find-in-page for hidden content
- **`beforematch` event** — fired when find-in-page reveals hidden content, triggers component open

These are Baseline 2024 features. See [caniuse: Popover API](https://caniuse.com/mdn-api_htmlelement_showpopover), [caniuse: hidden=until-found](https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value).

## ID Convention

Every component element uses a structured ID:

| Prefix | Role | Example |
|--------|------|---------|
| `mct:` | Trigger | `mct:accordion:abc123` |
| `mcc:` | Content | `mcc:accordion:abc123` |
| `mcr:` | Root | `mcr:accordion:abc123` |

The core matches on prefixes: `mct:a` (accordion trigger), `mct:c` (collapsible trigger), `mct:m` (menu trigger), `mct:t` (tabs trigger).

The trigger's `aria-controls` must reference the content's `id`. The content's `aria-labelledby` must reference the trigger's `id`.

## Component Reference

### Accordion

Collapsible content panels where only one (single mode) or multiple panels can be open.

**React API:**
```tsx
import { Accordion } from "monochrome/react"

<Accordion.Root type="single"> {/* or "multiple" */}
  <Accordion.Item open> {/* open = default open */}
    <Accordion.Header as="h3"> {/* heading level: h1-h6, default h3 */}
      <Accordion.Trigger>Section Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Content here</Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item disabled> {/* disabled = cannot toggle, skipped in keyboard navigation */}
    <Accordion.Header>
      <Accordion.Trigger>Disabled Section</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Content here</Accordion.Panel>
  </Accordion.Item>
</Accordion.Root>
```

**Required DOM structure for core:**
```
Root (mcr:accordion:*) [data-mode="single"|"multiple"]
  └─ Item (div)
       ├─ Header (h1-h6)
       │    └─ Trigger (button) [id=mct:accordion:*, aria-expanded, aria-controls, aria-disabled?]
       └─ Panel (div) [id=mcc:accordion:*, role=region, aria-labelledby, aria-hidden, hidden]
```

The core navigates via `item.firstElementChild.firstElementChild` to find the trigger — this exact nesting (Item > Header > Trigger) is required.

**Keyboard:** ArrowDown/Up (navigate items), Home/End (first/last item), Enter/Space (toggle via native button click). Disabled items (`aria-disabled="true"`) are skipped in keyboard navigation and cannot be toggled.

**Behavior:** In single mode, opening one item closes any other open item. In multiple mode, items operate independently.

### Collapsible

A single toggle for showing/hiding content. The simplest component.

**React API:**
```tsx
import { Collapsible } from "monochrome/react"

<Collapsible.Root open> {/* open = default open */}
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Panel>Content here</Collapsible.Panel>
</Collapsible.Root>
```

**Required DOM structure for core:**
```
Trigger (button) [id=mct:collapsible:*, aria-expanded, aria-controls]
Panel (div) [id=mcc:collapsible:*, aria-labelledby, aria-hidden, hidden]
```

No root element needed — the core links trigger to content via `aria-controls`.

**Keyboard:** Enter/Space (toggle via native button click). No arrow key navigation (correct per WAI-ARIA disclosure pattern).

### Tabs

Tabbed interface with manual activation and roving tabindex. Supports horizontal and vertical orientation.

**React API:**
```tsx
import { Tabs } from "monochrome/react"

<Tabs.Root defaultValue="tab1" orientation="horizontal"> {/* or "vertical" */}
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab2" disabled>Tab 2 (Disabled)</Tabs.Tab>
    <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1" focusable={true}>Content 1</Tabs.Panel>
  <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
  <Tabs.Panel value="tab3">Content 3</Tabs.Panel>
</Tabs.Root>
```

**Props:**
- `defaultValue` - Which tab is selected initially. If omitted, auto-detects the first `value` in the children tree.
- `orientation` - `"horizontal"` (default) or `"vertical"`. Controls which arrow keys navigate.
- `focusable` on Panel - When `true` (default), selected panel gets `tabindex="0"` so it's a Tab stop. Set to `false` when the panel contains its own focusable elements (links, buttons, inputs).

**Required DOM structure for core:**
```
Root (div) [id=mcr:tabs:*, data-orientation]
  ├─ List (div) [role=tablist, aria-orientation]
  │    ├─ Tab (button) [id=mct:tabs:*, role=tab, aria-selected, aria-controls, tabindex, aria-disabled?]
  │    └─ Tab (button) [...]
  ├─ Panel (div) [id=mcc:tabs:*, role=tabpanel, aria-labelledby, aria-hidden, hidden, tabindex?]
  └─ Panel (div) [...]
```

All Tab buttons must be direct children of the List (the core iterates `trigger.parentElement.firstElementChild` for siblings).

**Keyboard:** ArrowRight/Left (horizontal) or ArrowDown/Up (vertical) to move focus, Home/End (first/last tab), Enter/Space (activate via native button click). Manual activation — arrow keys move focus without activating. Disabled tabs (`aria-disabled="true"`) are skipped in keyboard navigation and cannot be activated.

### Menu

Dropdown menus, submenus, and menubars. Uses the Popover API for positioning.

**React API:**
```tsx
import { Menu } from "monochrome/react"

{/* Dropdown menu */}
<Menu.Root>
  <Menu.Trigger>Open Menu</Menu.Trigger>
  <Menu.Popover>
    <Menu.Item>Action 1</Menu.Item>
    <Menu.Item disabled>Disabled</Menu.Item>
    <Menu.Item href="/link">Link Item</Menu.Item>
    <Menu.Separator />
    <Menu.CheckboxItem checked={false}>Bold</Menu.CheckboxItem>
    <Menu.CheckboxItem checked>Italic</Menu.CheckboxItem>
    <Menu.Separator />
    <Menu.RadioItem checked>Small</Menu.RadioItem>
    <Menu.RadioItem checked={false}>Medium</Menu.RadioItem>
    <Menu.RadioItem checked={false}>Large</Menu.RadioItem>
    <Menu.Separator />
    <Menu.Group>
      <Menu.Trigger>Submenu</Menu.Trigger>
      <Menu.Popover>
        <Menu.Item>Sub Action</Menu.Item>
      </Menu.Popover>
    </Menu.Group>
  </Menu.Popover>
</Menu.Root>

{/* Menubar */}
<Menu.Root menubar>
  <Menu.Popover> {/* renders as <ul role="menubar"> */}
    <Menu.Group>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Popover>
        <Menu.Item>New</Menu.Item>
        <Menu.Item>Open</Menu.Item>
      </Menu.Popover>
    </Menu.Group>
    <Menu.Group>
      <Menu.Trigger>Edit</Menu.Trigger>
      <Menu.Popover>
        <Menu.Item>Undo</Menu.Item>
      </Menu.Popover>
    </Menu.Group>
  </Menu.Popover>
</Menu.Root>
```

**Sub-components:**
- `Menu.Item` - Renders as `<button>`, `<a>` (with `href`), or `<span>` (with `disabled`). Always wrapped in `<li role="none">`. Clicking closes the menu.
- `Menu.CheckboxItem` - Toggle item with `role="menuitemcheckbox"`. Props: `checked` (boolean), `disabled`. Clicking toggles `aria-checked` and keeps the menu open.
- `Menu.RadioItem` - Radio item with `role="menuitemradio"`. Props: `checked` (boolean), `disabled`. Clicking checks this item and unchecks siblings in the same implicit radio group. Menu stays open. Radio groups are determined by DOM position — consecutive radio items form a group, separated by non-radio items (separators, regular items, etc.).
- `Menu.Label` - Non-interactive label rendered as `<li role="presentation">`. Use for section headings within menus.
- `Menu.Separator` - Renders `<li role="separator">`. Use between groups of items. Skipped in keyboard navigation.
- `Menu.Group` - Wraps a submenu trigger + popover pair. Provides a new menu context with a unique ID.
- `Menu.Popover` - In menubar mode renders `<ul role="menubar">`. Otherwise renders `<ul role="menu" popover="manual">`.

**Required DOM structure for core:**
```
Root (div) [id=mcr:menu:*]
  ├─ Trigger (button) [id=mct:menu:*, role=button, aria-controls, aria-expanded, aria-haspopup=menu]
  └─ Popover (ul) [id=mcc:menu:*, role=menu, aria-labelledby, aria-hidden, popover=manual]
       ├─ li [role=none]
       │    └─ menuitem (button|a|span) [role=menuitem, tabindex=-1]
       ├─ li [role=none]
       │    └─ checkbox (button|span) [role=menuitemcheckbox, aria-checked, tabindex=-1]
       ├─ li [role=none]
       │    └─ radio (button|span) [role=menuitemradio, aria-checked, tabindex=-1]
       ├─ li [role=presentation] (Label - non-interactive heading)
       ├─ li [role=separator]
       └─ li [role=none] (Group - submenu wrapper)
            ├─ Trigger (button) [id=mct:menu:*, role=menuitem, aria-controls, aria-expanded, aria-haspopup=menu]
            └─ Popover (ul) [id=mcc:menu:*, role=menu, ...]
```

**Keyboard:**
- Trigger: ArrowDown (open, focus first), ArrowUp (open, focus last), Enter/Space (open via native click, focus first — detected via `event.detail === 0`)
- Menu items: ArrowDown/Up (navigate), Home/End (first/last), Escape (close), Tab (close all, move focus out), Enter/Space (activate via native click — fires external handlers, toggles checkbox/radio, closes menu for regular items), letter keys (typeahead)
- Submenu trigger: ArrowRight (open submenu), ArrowLeft (close submenu)
- Menubar: ArrowRight/Left navigate between menubar items

**Mouse:**
- Click trigger to open/close
- Hover submenu trigger to open submenu
- Hover different item to close submenu
- Click outside to close all
- Click menuitem to close all
- Click menuitemcheckbox to toggle `aria-checked` (menu stays open)
- Click menuitemradio to check it and uncheck same-group siblings (menu stays open)

**Disabled items:** Items with `aria-disabled="true"` are skipped during keyboard navigation and do not close the menu when clicked.

**stopPropagation pattern:** Users can call `e.stopPropagation()` on a menu item's click handler to prevent the core's global listener from closing the menu. This is useful for custom toggle behavior or other reasons to keep the menu open on item click.

**Typeahead:** Pressing a letter key focuses the next item whose text content starts with that letter. Cycles through matches.

## Activation Model

The core does **not** handle Enter/Space in keydown for any component. Instead, all activation goes through the global `click` handler. When a user presses Enter/Space on a `<button>`, the browser fires a native click event. The core distinguishes keyboard-triggered clicks from mouse clicks using `event.detail === 0` (keyboard-synthesized clicks have `detail === 0`, mouse clicks have `detail >= 1`).

This design means:
- External click handlers on triggers and menu items fire for both mouse and keyboard activation
- No `preventDefault()` blocks native button behavior
- The core only handles arrow keys, Home/End, Escape, and Tab in `keydown` — never Enter/Space

For menu triggers specifically, keyboard activation opens the menu with `Focus.First` (focuses the first item), while mouse clicks use `Focus.None` (menu opens but focus stays on the trigger).

## Safety Triangle (Submenu Hover Intent)

When a submenu is open, users need to move their mouse diagonally from the parent menu to the submenu. Without protection, crossing over other menu items would close the submenu.

**How it works:**

1. When a submenu opens, the core calculates the submenu's bounding rect and direction relative to its trigger.
2. A `data-safe` attribute is set on the Group element, along with CSS custom properties (`--left`, `--center`, `--right`, `--top`, `--bottom`) that define a triangular safe zone.
3. CSS uses these properties with `clip-path` to create an invisible triangle from the cursor position to the submenu edges.
4. While the cursor is within the trigger's bounding rect, each `pointermove` updates `--left` and `--center` (the triangle's point) to follow the cursor and sets `data-safe`. When the cursor leaves the rect, `data-safe` is removed — unless the cursor is moving toward the submenu (detected via `movementX` direction matching `safeDir`), in which case the safe zone is kept.
5. Touch events (`pointerType === "touch"`) are ignored entirely — the triangle is mouse-only.

**Key variables:**
- `safeGroup` - The Group `<li>` element that receives `data-safe`
- `safeRect` - The submenu trigger's bounding rect (defines the "cursor zone")
- `safeDir` - `-4` for right-opening submenus, `4` for left-opening. Also used as a pixel offset for the triangle point.

**CSS integration:** The consumer must style `[data-safe]` with a `clip-path` polygon using the CSS custom properties. The core only manages the attribute and properties.

## Common Pitfalls

Things agents must not break:

- **Never add `setTimeout`, `requestAnimationFrame`, or debounce** — all behavior is synchronous. The safety triangle uses velocity-based intent detection, not timers.
- **Never add per-component event listeners** — all behavior goes through the 6 global listeners (`click`, `pointermove`, `keydown`, `scroll`, `resize`, `beforematch`).
- **Accordion requires exact 3-level nesting: Item > Header > Trigger** — the core traverses `item.firstElementChild.firstElementChild` to find triggers.
- **Tab buttons must be direct siblings** — the core iterates via `trigger.parentElement.firstElementChild` for sibling navigation.
- **Radio groups in menus are implicit by DOM adjacency** — separators or non-radio items break the group boundary.
- **`aria-controls` on triggers must reference the content element's `id`** — missing or wrong values break all behavior.
- **Disabled items must use `aria-disabled="true"`**, not the HTML `disabled` attribute.
- **Disabled menu items render as `<span>`** (not `<button>`) to prevent click bubbling.
- **Never use `display: none` for hidden content** — always use `hidden="until-found"` to preserve find-in-page.

## hidden="until-found" and beforematch

React does not support `hidden="until-found"` as a prop value. The React wrappers use an inline `<script>` (`HiddenUntilFound` component) that runs during HTML parsing and upgrades `hidden=""` to `hidden="until-found"` on the parent element.

The core listens for the `beforematch` event (fired when browser find-in-page reveals hidden content) and opens the corresponding component:
- Accordion: opens the item (in single mode, closes others)
- Collapsible: opens it
- Tabs: activates the tab containing the found content

## Styling

The library is **headless/unstyled**. No CSS is shipped. Consumers provide their own styles. Key points:

- Menu popovers need `position: fixed` with `top: var(--bottom); left: var(--left)` (the core sets these CSS custom properties from `getBoundingClientRect()`).
- Submenus need `top: var(--top); left: var(--right)` and a gap (e.g., `margin-left: 8px`) so the core correctly detects the opening direction.
- `[popover]:popover-open { display: flex }` is needed for menu popover visibility.
- The `[data-safe]` attribute on Group elements should use `clip-path` for the triangle safe zone.

## Using the Core Without React

The core is framework-agnostic. To use it without React:

1. Include `monochrome` (the compiled JS) via `<script>` or `import "monochrome"`
2. Render HTML with the correct ID conventions, ARIA attributes, and DOM structure
3. The core's global event listeners handle everything automatically

```html
<script src="https://unpkg.com/monochrome"></script>

<div data-mode="single" id="mcr:accordion:faq">
  <div>
    <h3>
      <button type="button" id="mct:accordion:faq-1" aria-expanded="false" aria-controls="mcc:accordion:faq-1">
        Question?
      </button>
    </h3>
    <div id="mcc:accordion:faq-1" role="region" aria-labelledby="mct:accordion:faq-1" aria-hidden="true" hidden="until-found">
      Answer.
    </div>
  </div>
</div>

<!-- Tabs -->
<div data-orientation="horizontal" id="mcr:tabs:demo">
  <div role="tablist" aria-orientation="horizontal">
    <button type="button" role="tab" id="mct:tabs:demo-1" aria-selected="true" aria-controls="mcc:tabs:demo-1" tabindex="0">
      Tab 1
    </button>
    <button type="button" role="tab" id="mct:tabs:demo-2" aria-selected="false" aria-controls="mcc:tabs:demo-2" tabindex="-1">
      Tab 2
    </button>
  </div>
  <div role="tabpanel" id="mcc:tabs:demo-1" aria-labelledby="mct:tabs:demo-1" aria-hidden="false" tabindex="0">
    Panel 1 content.
  </div>
  <div role="tabpanel" id="mcc:tabs:demo-2" aria-labelledby="mct:tabs:demo-2" aria-hidden="true" hidden="until-found" tabindex="-1">
    Panel 2 content.
  </div>
</div>

<!-- Menu dropdown -->
<div id="mcr:menu:demo">
  <button type="button" id="mct:menu:demo" aria-controls="mcc:menu:demo" aria-expanded="false" aria-haspopup="menu">
    Open Menu
  </button>
  <ul id="mcc:menu:demo" role="menu" aria-labelledby="mct:menu:demo" aria-hidden="true" popover="manual"
      style="position: fixed; top: var(--bottom); left: var(--left);">
    <li role="none"><button type="button" role="menuitem" tabindex="-1">Action 1</button></li>
    <li role="none"><button type="button" role="menuitem" tabindex="-1">Action 2</button></li>
    <li role="separator"></li>
    <li role="none"><span role="menuitem" aria-disabled="true" tabindex="-1">Disabled</span></li>
  </ul>
</div>
```

## Testing

The library uses Playwright for testing. Tests run against fixture pages served by a test server that SSR-renders React components.

```bash
bun test              # Run all tests
bun test -- --grep "Safety"  # Run specific tests
```

Test fixtures are in `tests/fixtures/{component}/`. Each fixture is a `.tsx` file that exports a default React component.

## File Structure

```
src/
  index.ts              # Core library (single file, ~550 lines)
  react/
    index.ts            # Re-exports all React components
    accordion.tsx       # Accordion compound components
    collapsible.tsx     # Collapsible compound components
    menu.tsx            # Menu compound components (including Label, Separator)
    tabs.tsx            # Tabs compound components
    shared.tsx          # BaseProps type, buildId utility, HiddenUntilFound component
tests/
  server.tsx            # Bun test server (SSR + static files)
  accordion.spec.ts     # 65 Playwright tests
  collapsible.spec.ts   # 41 Playwright tests
  menu.spec.ts          # 175 Playwright tests
  tabs.spec.ts          # 69 Playwright tests
  fixtures/             # Test page components
```
