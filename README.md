# monochrome

Accessible UI component library. Best-in-class performance. HTML-first, React supported.

<!-- badges -->
![gzip](https://img.shields.io/badge/gzip-2.2kB-brightgreen) ![tests](https://img.shields.io/badge/tests-350_passing-brightgreen) ![WCAG](https://img.shields.io/badge/WCAG_2.2-AA-blue) ![license](https://img.shields.io/badge/license-MIT-blue)
<!-- /badges -->

## Install

```bash
npm install monochrome
```

## How it works

monochrome uses the DOM as its source of truth. Instead of managing state in JavaScript, it reads ARIA attributes, responds to user interactions, and updates them directly. Minimal global event listeners handle every component on the page through event delegation. No initialization, no configuration, no framework required.

Write semantic HTML, load the script, and everything becomes interactive.

## Usage

### React

```tsx
import "monochrome"
import { Accordion } from "monochrome/react"

export function FAQ() {
  return (
    <Accordion.Root type="single">
      <Accordion.Item>
        <Accordion.Header>
          <Accordion.Trigger>What is monochrome?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          <p>A tiny, accessible UI component library.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  )
}
```

Import `"monochrome"` once at your app's entry point. The React wrappers generate the correct HTML structure and ARIA attributes. All interactivity comes from the monochrome runtime. No React needed on the client.

### HTML

monochrome works with any framework or no framework at all. Write semantic HTML with the ID convention and everything just works:

```html
<script src="https://unpkg.com/monochrome"></script>

<button
  id="mct:collapsible:demo"
  aria-expanded="false"
  aria-controls="mcc:collapsible:demo"
>
  Toggle
</button>
<div id="mcc:collapsible:demo" aria-hidden="true" hidden="until-found">
  Content appears here.
</div>
```


### React Components

<details>
<summary>Collapsible</summary>

```tsx
import { Collapsible } from "monochrome/react"

<Collapsible.Root open>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Panel>Content here</Collapsible.Panel>
</Collapsible.Root>
```
</details>

<details>
<summary>Tabs</summary>

```tsx
import { Tabs } from "monochrome/react"

<Tabs.Root defaultValue="tab1" orientation="horizontal">
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
</Tabs.Root>
```
</details>

<details>
<summary>Menu</summary>

```tsx
import { Menu } from "monochrome/react"

<Menu.Root>
  <Menu.Trigger>Open Menu</Menu.Trigger>
  <Menu.Popover>
    <Menu.Item>Action 1</Menu.Item>
    <Menu.Item disabled>Disabled</Menu.Item>
    <Menu.Separator />
    <Menu.CheckboxItem checked={false}>Bold</Menu.CheckboxItem>
    <Menu.RadioItem checked>Small</Menu.RadioItem>
    <Menu.RadioItem checked={false}>Large</Menu.RadioItem>
  </Menu.Popover>
</Menu.Root>
```
</details>

## Components

Four interactive UI patterns in <!-- size -->2.2kB<!-- /size -->:

| Component | Description | Tests |
| --- | --- | ---: |
| **Accordion** | Grouped collapsible content sections | <!-- tests:accordion -->65<!-- /tests:accordion --> |
| **Collapsible** | Show and hide content with a button | <!-- tests:collapsible -->41<!-- /tests:collapsible --> |
| **Menu** | Dropdown menus, menubars, and submenus | <!-- tests:menu -->175<!-- /tests:menu --> |
| **Tabs** | Switch between multiple content panels | <!-- tests:tabs -->69<!-- /tests:tabs --> |

## Accessibility

Every component follows [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) and targets WCAG 2.2 AA:

- Full keyboard navigation (Arrow keys, Home, End, Enter, Space, Escape)
- Roving tabindex for focus management
- Automatic ARIA attribute management
- Preserves browser find-in-page (cmd+f)
- Screen reader support out of the box

## Performance

- Event delegation: minimal global listeners shared across all components
- No per-component instances, state objects, or memory allocations
- Zero DOM queries, navigates through direct element pointers
- Adding more components to the page costs nothing at runtime

> Performance isn't a feature, it's a consequence of the architecture. When you don't have per-component state, per-component listeners, or a rendering framework, there's nothing left to be slow.

## Styling

monochrome is headless — no CSS is shipped. You provide all styles. Key requirements for menus:

```css
/* Menu popover visibility */
[popover]:popover-open {
  display: flex;
}

/* Menu positioning (core sets --top, --right, --bottom, --left from getBoundingClientRect) */
[role="menu"] {
  position: fixed;
  top: var(--bottom);
  left: var(--left);
}

/* Submenu positioning */
[role="menu"] [role="menu"] {
  top: var(--top);
  left: var(--right);
}
```

## Browser Requirements

The core depends on [Popover API](https://caniuse.com/mdn-api_htmlelement_showpopover) and [`hidden="until-found"`](https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value) (Baseline 2024). All modern browsers are supported.

## License

MIT &copy; Colin van Eenige
