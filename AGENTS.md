# Monochrome

Accessible, headless UI components. Four components — Accordion, Collapsible, Menu, Tabs — powered by a ~2KB core with zero dependencies.

Framework-agnostic core with React and Vue wrappers included. The core uses event delegation and ARIA attributes as the source of truth. Import it once and every component on the page works automatically.

---

# Part 1: Using Monochrome

> For AI agents helping developers build with monochrome.

## Installation

```bash
npm install monochrome    # Core + React + Vue wrappers included
```

```ts
import "monochrome"                        // Core (auto-activates)
import { Accordion, Tabs } from "monochrome/react"  // React
import { Accordion, Tabs } from "monochrome/vue"    // Vue
```

## Components

### Accordion

Collapsible content panels. `type="single"` allows one open at a time. `type="multiple"` allows any combination.

<table>
<tr><th>React</th><th>Vue</th></tr>
<tr><td>

```tsx
import { Accordion } from "monochrome/react"

<Accordion.Root type="single">
  <Accordion.Item open>
    <Accordion.Header as="h3">
      <Accordion.Trigger>
        Section Title
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      Content here
    </Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item disabled>
    <Accordion.Header>
      <Accordion.Trigger>
        Disabled
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      Content here
    </Accordion.Panel>
  </Accordion.Item>
</Accordion.Root>
```

</td><td>

```vue
<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <Accordion.Root type="single">
    <Accordion.Item :open="true">
      <Accordion.Header as="h3">
        <Accordion.Trigger>
          Section Title
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        Content here
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item :disabled="true">
      <Accordion.Header>
        <Accordion.Trigger>
          Disabled
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        Content here
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
</template>
```

</td></tr>
</table>

**Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `type` | `"single" \| "multiple"` | `"single"` | Whether one or many panels can be open |
| `Item` | `open` | `boolean` | `false` | Start open |
| `Item` | `disabled` | `boolean` | `false` | Cannot toggle, skipped by keyboard |
| `Header` | `as` | `"h1"` – `"h6"` | `"h3"` | Heading level |

**Keyboard:** ArrowDown/Up navigate items, Home/End jump to first/last, Enter/Space toggle.

### Collapsible

A single trigger that shows/hides content.

<table>
<tr><th>React</th><th>Vue</th></tr>
<tr><td>

```tsx
import { Collapsible } from "monochrome/react"

<Collapsible.Root open>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Panel>Content</Collapsible.Panel>
</Collapsible.Root>
```

</td><td>

```vue
<script setup lang="ts">
import { Collapsible } from "monochrome/vue"
</script>

<template>
  <Collapsible.Root :open="true">
    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
    <Collapsible.Panel>Content</Collapsible.Panel>
  </Collapsible.Root>
</template>
```

</td></tr>
</table>

**Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `open` | `boolean` | `false` | Start open |

**Keyboard:** Enter/Space toggle. No arrow key navigation (WAI-ARIA disclosure pattern).

### Tabs

Tabbed interface with manual activation and roving tabindex.

<table>
<tr><th>React</th><th>Vue</th></tr>
<tr><td>

```tsx
import { Tabs } from "monochrome/react"

<Tabs.Root
  defaultValue="tab1"
  orientation="horizontal"
>
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab2" disabled>
      Tab 2
    </Tabs.Tab>
    <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
  <Tabs.Panel value="tab3">Content 3</Tabs.Panel>
</Tabs.Root>
```

</td><td>

```vue
<script setup lang="ts">
import { Tabs } from "monochrome/vue"
</script>

<template>
  <Tabs.Root
    default-value="tab1"
    orientation="horizontal"
  >
    <Tabs.List>
      <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
      <Tabs.Tab value="tab2" :disabled="true">
        Tab 2
      </Tabs.Tab>
      <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
    <Tabs.Panel value="tab3">Content 3</Tabs.Panel>
  </Tabs.Root>
</template>
```

</td></tr>
</table>

**Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `defaultValue` | `string` | — | Initially selected tab |
| `Root` | `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Arrow key direction |
| `Tab` | `value` | `string` | — | Unique tab identifier |
| `Tab` | `disabled` | `boolean` | `false` | Cannot activate, skipped by keyboard |
| `Panel` | `value` | `string` | — | Must match a Tab's value |
| `Panel` | `focusable` | `boolean` | `true` | Set `false` when panel has its own focusable elements |

**Note:** In Vue templates, `defaultValue` is written as `default-value` (standard Vue kebab-case mapping).

**Keyboard:** ArrowRight/Left (horizontal) or ArrowDown/Up (vertical), Home/End, Enter/Space to activate.

### Menu

Dropdown menus, submenus, and menubars. Uses the Popover API.

<table>
<tr><th>React</th><th>Vue</th></tr>
<tr><td>

```tsx
import { Menu } from "monochrome/react"

<Menu.Root>
  <Menu.Trigger>Open Menu</Menu.Trigger>
  <Menu.Popover>
    <Menu.Item>Action</Menu.Item>
    <Menu.Item disabled>Disabled</Menu.Item>
    <Menu.Item href="/link">Link</Menu.Item>
    <Menu.Separator />
    <Menu.CheckboxItem checked={false}>
      Bold
    </Menu.CheckboxItem>
    <Menu.RadioItem checked>Small</Menu.RadioItem>
    <Menu.RadioItem checked={false}>
      Large
    </Menu.RadioItem>
    <Menu.Separator />
    <Menu.Label>Section</Menu.Label>
    <Menu.Group>
      <Menu.Trigger>Submenu</Menu.Trigger>
      <Menu.Popover>
        <Menu.Item>Sub Action</Menu.Item>
      </Menu.Popover>
    </Menu.Group>
  </Menu.Popover>
</Menu.Root>
```

</td><td>

```vue
<script setup lang="ts">
import { Menu } from "monochrome/vue"
</script>

<template>
  <Menu.Root>
    <Menu.Trigger>Open Menu</Menu.Trigger>
    <Menu.Popover>
      <Menu.Item>Action</Menu.Item>
      <Menu.Item :disabled="true">Disabled</Menu.Item>
      <Menu.Item href="/link">Link</Menu.Item>
      <Menu.Separator />
      <Menu.CheckboxItem :checked="false">
        Bold
      </Menu.CheckboxItem>
      <Menu.RadioItem :checked="true">Small</Menu.RadioItem>
      <Menu.RadioItem :checked="false">
        Large
      </Menu.RadioItem>
      <Menu.Separator />
      <Menu.Label>Section</Menu.Label>
      <Menu.Group>
        <Menu.Trigger>Submenu</Menu.Trigger>
        <Menu.Popover>
          <Menu.Item>Sub Action</Menu.Item>
        </Menu.Popover>
      </Menu.Group>
    </Menu.Popover>
  </Menu.Root>
</template>
```

</td></tr>
</table>

**Menubar** — set `menubar` (React) or `:menubar="true"` (Vue) on `Menu.Root`:

```tsx
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

| Component | Description |
|-----------|-------------|
| `Item` | Renders `<button>`, `<a>` (with `href`), or `<span>` (with `disabled`). Click closes the menu. |
| `CheckboxItem` | Toggle item (`role="menuitemcheckbox"`). Click toggles `aria-checked`, menu stays open. |
| `RadioItem` | Radio item (`role="menuitemradio"`). Groups are implicit by DOM adjacency — separators break groups. |
| `Label` | Non-interactive heading (`role="presentation"`). |
| `Separator` | Visual divider (`role="separator"`). Skipped by keyboard. |
| `Group` | Wraps a submenu trigger + popover pair. |
| `Popover` | `<ul role="menu">` (or `role="menubar"` in menubar mode). |

**Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `menubar` | `boolean` | `false` | Menubar mode |
| `Item` | `disabled` | `boolean` | `false` | Non-interactive, skipped by keyboard |
| `Item` | `href` | `string` | — | Renders as `<a>` instead of `<button>` |
| `CheckboxItem` | `checked` | `boolean` | `false` | Checked state |
| `CheckboxItem` | `disabled` | `boolean` | `false` | Non-interactive, skipped by keyboard |
| `RadioItem` | `checked` | `boolean` | `false` | Selected state |
| `RadioItem` | `disabled` | `boolean` | `false` | Non-interactive, skipped by keyboard |

**Keyboard:** ArrowDown/Up navigate, Home/End, Escape closes, Tab closes all, Enter/Space activates, ArrowRight opens submenu, ArrowLeft closes submenu, letter keys for typeahead.

**stopPropagation pattern:** Call `e.stopPropagation()` on an item's click handler to prevent the menu from closing.

## Styling

Monochrome is **headless** — no CSS shipped. You provide all styles. Required CSS for menus:

```css
/* Menu popover positioning (core sets --bottom, --left, --top, --right via getBoundingClientRect) */
[role="menu"] {
  position: fixed;
  inset: auto;
  margin: 0;
  top: var(--bottom);
  left: var(--left);
}

/* Submenu positioning */
[role="menu"] [role="menu"] {
  top: var(--top);
  left: var(--right);
  margin-left: 8px;  /* gap so core detects opening direction */
}

/* Popover visibility */
[popover]:popover-open {
  display: flex;
}
```

For submenu hover safety triangles, style `[data-safe]` with a `clip-path` polygon using the CSS custom properties the core sets (`--left`, `--center`, `--right`, `--top`, `--bottom`).

## Browser Requirements

Requires Baseline 2024 features:
- **Popover API** — menu positioning
- **`hidden="until-found"`** — preserves Ctrl+F / Cmd+F for hidden content
- **`beforematch` event** — auto-opens components when find-in-page reveals hidden content

## Plain HTML (No Framework)

The core is framework-agnostic. Include the script and render the correct HTML structure:

```html
<script src="https://unpkg.com/monochrome"></script>

<!-- Accordion -->
<div data-mode="single" id="mcr:accordion:faq">
  <div>
    <h3>
      <button type="button" id="mct:accordion:faq-1"
        aria-expanded="false" aria-controls="mcc:accordion:faq-1">
        Question?
      </button>
    </h3>
    <div id="mcc:accordion:faq-1" role="region"
      aria-labelledby="mct:accordion:faq-1" aria-hidden="true"
      hidden="until-found">
      Answer.
    </div>
  </div>
</div>
```

## Vue-Specific Notes

- Boolean props require `:` binding — `:open="true"`, `:disabled="true"`, `:checked="false"`
- `defaultValue` → `default-value` in templates (Vue auto-maps camelCase to kebab-case)
- Dot notation works natively — `<Accordion.Root>`, `<Menu.Item>`, etc.
- Vue wrappers use `provide`/`inject` for component context

## React-Specific Notes

- Boolean props use JSX shorthand — `open`, `disabled`, `checked`
- `className` for CSS classes (standard React)

## Wrapper Implementation

Both React and Vue wrappers use plain `createElement`/`h()` render functions — no JSX, no `.vue` SFCs. This keeps the source framework-agnostic in style and produces minimal bundle output.

- **React** uses `createElement()` directly instead of JSX. This eliminates the `react/jsx-runtime` import, produces smaller bundles, and improves Preact compatibility (one fewer module alias needed).
- **Vue** uses `defineComponent()` with `h()` render functions instead of SFC templates. The Vue SFC compiler adds significant overhead (patch flags, block tracking, `openBlock`/`createElementBlock`). Hand-written `h()` cuts the Vue bundle in half.

Both wrappers are thin: they render the correct DOM structure + ARIA attributes and wire up context (`createContext`/`useContext` in React, `provide`/`inject` in Vue). All behavior comes from the core.

---

# Part 2: Contributing

> For AI agents working on the monochrome repository itself.

## Development

```bash
bun install            # Install dependencies
bun build.ts           # Build core + React + Vue to dist/, update README badges
bun test               # Run all 354 Playwright tests × 3 renderers (HTML + React + Vue)
bun run lint           # Biome lint check
bun run format         # Biome format
```

**Biome config:** 2-space indent, 100-char line width, double quotes, semicolons as needed.

## Design Principles

1. **DOM is the source of truth** — The core reads ARIA attributes to determine state. No internal state objects.
2. **Event delegation** — Six global listeners handle everything: `click`, `pointermove`, `keydown`, `scroll`, `resize`, `beforematch`. Zero per-component listeners.
3. **Zero timers** — All behavior is synchronous. No `setTimeout`, no `requestAnimationFrame`, no debounce.
4. **ID conventions drive behavior** — Elements are identified by ID prefix (`mct:`, `mcc:`, `mcr:`), not classes or data attributes.
5. **`hidden="until-found"`** — Never `display: none`. Preserves browser find-in-page.

## ID Convention

| Prefix | Role | Matched by core |
|--------|------|-----------------|
| `mct:a` | Accordion trigger | `mct:accordion:*` |
| `mct:c` | Collapsible trigger | `mct:collapsible:*` |
| `mct:m` | Menu trigger | `mct:menu:*` |
| `mct:t` | Tabs trigger | `mct:tabs:*` |
| `mcc:` | Content panel | Linked via `aria-controls` |
| `mcr:` | Root container | Component boundary |

## Required DOM Structure

**Accordion** — the core traverses `item.firstElementChild.firstElementChild` to find triggers. This exact nesting is required:
```
Root [data-mode] → Item → Header (h1-h6) → Trigger (button)
                        → Panel [role=region]
```

**Tabs** — all Tab buttons must be direct children of the List (core iterates via `parentElement.firstElementChild`):
```
Root [data-orientation] → List [role=tablist] → Tab (button) [role=tab]
                        → Panel [role=tabpanel]
```

**Menu** — every item is wrapped in `<li role="none">`:
```
Root → Trigger (button) [aria-haspopup=menu]
     → Popover (ul) [role=menu, popover=manual]
          → li [role=none] → menuitem (button|a|span)
          → li [role=separator]
          → li [role=none] (Group) → Trigger + Popover (submenu)
```

## Activation Model

The core never handles Enter/Space in `keydown`. All activation flows through the global `click` listener. When a user presses Enter/Space on a `<button>`, the browser fires a native click. The core distinguishes keyboard from mouse via `event.detail` (`0` = keyboard, `≥1` = mouse).

Menu triggers: keyboard opens with `Focus.First` (first item focused), mouse with `Focus.None` (focus stays on trigger).

## Safety Triangle (Submenu Hover Intent)

When a submenu is open, the core creates a triangular safe zone so users can move diagonally to it without accidentally closing it.

1. The core calculates the submenu's bounding rect and direction
2. Sets `data-safe` attribute + CSS custom properties (`--left`, `--center`, `--right`, `--top`, `--bottom`) on the Group element
3. Each `pointermove` updates the triangle point to follow the cursor
4. Direction is detected via `movementX` matching `safeDir` (`-4` for right-opening, `4` for left-opening)
5. Touch events (`pointerType === "touch"`) are ignored

## hidden="until-found"

React and Vue don't support `hidden="until-found"` as a prop value. Both wrappers inject an inline `<script>` (`HiddenUntilFound` component) that upgrades `hidden=""` to `hidden="until-found"` during HTML parsing.

The core's `beforematch` listener auto-opens the containing component when find-in-page reveals hidden content.

## Testing

354 tests across three renderers: **HTML**, **React**, **Vue**. Every test runs against all three.

```bash
bun test                            # All 354 tests × 3 renderers
bun test -- --project=vue           # Vue only
bun test -- --project=react         # React only
bun test -- --project=html          # HTML only
bun test -- --grep "Safety"         # Specific tests, all renderers
```

**Test server** (`tests/server.tsx`):
- HTML fixtures → served as static `.html`
- React fixtures → SSR via `renderToString` (static) or client-side bundle (dynamic)
- Vue fixtures → SSR via `createSSRApp` + `vueRenderToString` for `.vue` files, client-side bundle for `.ts` entries
- Vue SFC compilation uses `@vue/compiler-sfc` registered as a Bun plugin
- Global `data-action` click handler injected into the HTML template (no per-fixture `<script>` tags)

**Static vs dynamic fixtures:** Static fixtures `export default` a component → SSR-rendered. Dynamic fixtures (with `ref()`, `useState()`) don't export → client-side mounted via `<script type="module">`.

## Common Pitfalls

Things that must not be broken:

- **Never add timers** — no `setTimeout`, `requestAnimationFrame`, or debounce
- **Never add per-component event listeners** — everything goes through 6 global listeners
- **Accordion nesting is sacred** — Item > Header > Trigger, exactly 3 levels
- **Tab buttons must be direct siblings** — core iterates via `parentElement.firstElementChild`
- **Menu radio groups are by DOM adjacency** — separators or non-radio items break the group
- **`aria-controls` must match content `id`** — wrong values break everything
- **Disabled = `aria-disabled="true"`** — never the HTML `disabled` attribute
- **Disabled menu items render as `<span>`** — not `<button>`, to prevent click bubbling
- **Never `display: none`** — always `hidden="until-found"` for find-in-page
- **Vue typeahead text** — menu item text must be inline (`<Menu.Item>Apple</Menu.Item>`) to avoid leading whitespace breaking `textContent.startsWith()`

## File Structure

```
src/
  index.ts                # Core (~550 lines, single file)
  react/
    index.ts              # Re-exports
    shared.ts             # BaseProps, buildId, HiddenUntilFound
    accordion.ts          # createElement() render functions
    collapsible.ts
    menu.ts
    tabs.ts
  vue/
    index.ts              # Re-exports as namespaced objects
    shared.ts             # buildId, HiddenUntilFound, InjectionKeys
    accordion.ts          # h() render functions via defineComponent()
    collapsible.ts
    menu.ts
    tabs.ts
tests/
  server.tsx              # Test server (SSR + bundles)
  fixtures.ts             # Playwright fixture with `renderer` option
  accordion.spec.ts       # 66 tests × 3 renderers
  collapsible.spec.ts     # 42 tests × 3 renderers
  menu.spec.ts            # 176 tests × 3 renderers
  tabs.spec.ts            # 70 tests × 3 renderers
  fixtures/
    test.css              # Minimal test styles
    html/                 # Static HTML fixtures
    react/                # React .tsx fixtures
    vue/                  # Vue .vue SFCs + dynamic .ts entries + App.vue
```
