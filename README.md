# Monochrome

Accessible UI component library. Best-in-class performance. HTML-first, React and Vue supported.

<!-- badges -->
![gzip](https://img.shields.io/badge/gzip-2.2kB-brightgreen) ![tests](https://img.shields.io/badge/tests-354_passing-brightgreen) ![WCAG](https://img.shields.io/badge/WCAG_2.2-AA-blue) ![license](https://img.shields.io/badge/license-MIT-blue)
<!-- /badges -->

## Install

```bash
npm install monochrome
```

```ts
import "monochrome"                               // Core (auto-activates)
import { Accordion } from "monochrome/react"       // React
import { Accordion } from "monochrome/vue"         // Vue
```

## Usage

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

Import `"monochrome"` once at your app's entry point. The wrappers generate the correct HTML structure and ARIA attributes. All interactivity comes from the Monochrome runtime - no framework JavaScript needed on the client.

The Vue API is identical: `import { Accordion } from "monochrome/vue"`. Monochrome also works with plain HTML or any framework that outputs HTML. See [AGENTS.md](./AGENTS.md) for full documentation.

## Components

Four interactive UI patterns in <!-- size -->2.2kB<!-- /size -->:

| Component | Description | Tests |
| --- | --- | ---: |
| **Accordion** | Grouped collapsible content sections | <!-- tests:accordion -->66<!-- /tests:accordion --> |
| **Collapsible** | Show and hide content with a button | <!-- tests:collapsible -->42<!-- /tests:collapsible --> |
| **Menu** | Dropdown menus, menubars, and submenus | <!-- tests:menu -->176<!-- /tests:menu --> |
| **Tabs** | Switch between multiple content panels | <!-- tests:tabs -->70<!-- /tests:tabs --> |

## How it works

Monochrome uses the DOM as its source of truth. Instead of managing state in JavaScript, it reads ARIA attributes, responds to user interactions, and updates them directly. Minimal global event listeners handle every component on the page through event delegation. No initialization, no configuration, no framework required.

## Accessibility

Every component follows [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) and targets WCAG 2.2 AA:

- Full keyboard navigation (Arrow keys, Home, End, Enter, Space, Escape)
- Roving tabindex for focus management
- Automatic ARIA attribute management
- Preserves browser find-in-page (cmd+f)
- Screen reader support out of the box

## Styling

Monochrome is headless - no CSS is shipped. You provide all styles. Key requirements for menus:

```css
[popover]:popover-open {
  display: flex;
}

[role="menu"] {
  position: fixed;
  top: var(--bottom);
  left: var(--left);
}

[role="menu"] [role="menu"] {
  top: var(--top);
  left: var(--right);
}
```

## Browser Requirements

The core depends on [Popover API](https://caniuse.com/mdn-api_htmlelement_showpopover) and [`hidden="until-found"`](https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value) (Baseline 2024). All modern browsers are supported.

## License

MIT &copy; Colin van Eenige
