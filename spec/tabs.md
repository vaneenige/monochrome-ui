---
title: Tabs
description: A row of tabs that switches between panels, one visible at a time.
---

# Tabs

Tabs switch between panels of content that share one place on the
page. Exactly one tab is selected and only its panel is visible. It
implements the WAI-ARIA Tabs pattern with manual activation: arrow
keys move focus along the tabs, and Enter, Space, or a click selects
the focused tab. The list can be horizontal or vertical.

## Anatomy

```html
<div id="mcr:tabs:settings">
  <div role="tablist" aria-label="Settings" aria-orientation="horizontal">
    <button type="button" role="tab" id="mct:tabs:settings-account" aria-selected="true" aria-controls="mcc:tabs:settings-account" tabindex="0">
      Account
    </button>
    <button type="button" role="tab" id="mct:tabs:settings-billing" aria-selected="false" aria-controls="mcc:tabs:settings-billing" tabindex="-1">
      Billing
    </button>
    <button type="button" role="tab" id="mct:tabs:settings-team" aria-selected="false" aria-controls="mcc:tabs:settings-team" tabindex="-1" aria-disabled="true">
      Team
    </button>
  </div>
  <div role="tabpanel" id="mcc:tabs:settings-account" aria-labelledby="mct:tabs:settings-account" tabindex="0">
    <p>Name, email, and password.</p>
  </div>
  <div role="tabpanel" id="mcc:tabs:settings-billing" aria-labelledby="mct:tabs:settings-billing" tabindex="-1" hidden>
    <p>Plan and invoices.</p>
  </div>
  <div role="tabpanel" id="mcc:tabs:settings-team" aria-labelledby="mct:tabs:settings-team" tabindex="-1" hidden>
    <p>Members and roles.</p>
  </div>
</div>
```

Tabs must be direct children of the `role="tablist"` element: the
core walks that element's children to rove and to find the
previously selected tab. Panels can live anywhere. The
`mcr:tabs:` root is optional; the parts render it, and the
core never reads it; it is a hook for your own layout, such as a
vertical list beside the panels.

## Parts

`npx monochrome add tabs` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- `defaultValue` on the root names the tab selected first;
  `orientation` is `"horizontal"` (default) or `"vertical"`. Name
  the list with `aria-label` on `Tabs.List`.
- `value` links a tab to its panel and becomes part of both ids, so
  it is unique within the root and has no spaces.
- `focusable` false leaves `tabindex` off the panel, for panels
  whose first meaningful content is focusable (see
  [Accessibility](#accessibility)).
- If you use `defaultSelected`, set it on the tab and its panel
  alike.

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Root | `mcr:tabs:ID` | optional | nothing |
| Tab list | none | `role="tablist"`, `aria-orientation` for vertical lists, a name | nothing |
| Tab | `mct:tabs:ID` | `<button type="button">`, `role="tab"`, `aria-selected`, `aria-controls`, `tabindex` (`0` selected, `-1` others) | `aria-selected`, `tabindex` |
| Panel | `mcc:tabs:ID` | `role="tabpanel"`, `aria-labelledby` (the tab), `hidden` unless selected | `hidden`, `tabindex` when present |

Exactly one tab per list has `aria-selected="true"`. Optional:
`aria-disabled="true"` on a tab. A panel `tabindex` is managed only
when the panel already has one: `0` on the selected panel, `-1` on
the rest.

## Keyboard

| Key | Action |
| --- | --- |
| ArrowRight, ArrowLeft (horizontal) | Focus the next or previous enabled tab, wrapping |
| ArrowDown, ArrowUp (vertical) | Focus the next or previous enabled tab, wrapping |
| Home, End | Focus the first or last enabled tab |
| Enter, Space | Select the focused tab (native button click) |
| Tab | Leave the list: into the selected panel, or past it |

With `dir="rtl"` on `html`, the horizontal arrows swap. The arrow
keys skip disabled and hidden tabs, and a disabled tab ignores
clicks.

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[role="tab"][aria-selected="true"]`: the selected tab.
- `[role="tab"][aria-disabled="true"]`: a disabled tab.
- `[role="tablist"][aria-orientation="vertical"]`: a vertical list.
- `[role="tabpanel"]`: a panel; every panel but the selected tab's
  carries `hidden`.
- `[id^="mcr:tabs:"]`: the root around the list and the panels.

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
/* A row of tabs, or a column when vertical. */
[role="tablist"] {
  display: flex;
}
[role="tablist"][aria-orientation="vertical"] {
  flex-direction: column;
}
/* The selected tab: nothing else shows which one it is. */
[role="tab"][aria-selected="true"] {
  background-color: color-mix(in srgb, currentColor 8%, transparent);
}
/* A disabled tab stays focusable, so show it. */
[role="tab"][aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
[role="tab"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
/* A panel without focusable content is a tab stop itself. */
[role="tabpanel"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Accessibility

- Name the list with `aria-label` or `aria-labelledby`.
- Only the selected tab is in the tab order (`tabindex="0"`), so
  the list is one stop and arrows move within it.
- Tab from the list goes to the selected panel. Give the panel
  `tabindex="0"` (the parts' default) when its first meaningful
  content is text or a heading, so the panel is the stop and is
  read from the top. Leave it off (the parts: `focusable` false) when
  the first meaningful content is a link, button, or field, so Tab
  lands on that control directly. "First meaningful" skips
  wrappers: a `div` around a button still starts with the button.

## Design choices

- **Manual activation.** Arrow keys move focus; Enter, Space, or a
  click selects. APG recommends automatic activation when panels
  show without delay. Here a focus move never swaps content under
  a screen reader or a pointer, and a panel that loads its content
  when selected (by observing `aria-selected`) loads only when
  asked to.
- **Always exactly one selected.** Clicking the selected tab does
  nothing; there is no state with every panel hidden.
- **Disabled tabs are out of the keyboard's way.** Arrows skip
  them, and as `tabindex="-1"` tabs they are not Tab stops either.
  A screen reader still reads them in the list.
- **Tab order decides; nothing moves focus.** Selecting a tab
  keeps focus on it, and the core never moves focus into a panel.
  Where Tab goes next is the panel's `tabindex`, set in markup.
  This is the tabs side of the dialog rule: the container is the
  default stop, and you opt into a control inside.

## Common mistakes

- Wrapping each tab in its own element (an `li`, a `div`). Roving
  and deselection walk the tablist's direct children. Fix: tabs are
  direct children of `role="tablist"`.
- Two tabs with `aria-selected="true"`, or none. Fix: exactly one.
- Every tab at `tabindex="0"`. Fix: `0` on the selected tab, `-1` on
  the others.
- A visible panel for an unselected tab, or `hidden` on the selected
  one. Fix: `hidden` on every panel except the selected tab's.
- `autofocus` inside a panel to steer focus. Outside a dialog it
  fires on page load and pulls focus into the panel before the
  user does anything. Fix: steer Tab with the panel's `tabindex`.
- Giving panels `display: flex` or `grid`. That beats the
  browser's `hidden` rule and shows every panel. Fix: give it a
  `display` on `:not([hidden])` only.
- Using `aria-orientation` on the tabs instead of the tablist. Fix:
  put it on the element with `role="tablist"`.
