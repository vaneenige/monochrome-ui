---
title: Collapsible
description: One button that shows and hides one region.
---

# Collapsible

A collapsible is a single button that shows or hides one region of
content. It implements the WAI-ARIA Disclosure pattern: the button
carries `aria-expanded` and the region toggles `hidden`. Collapsibles
are independent of each other; for a group where opening one closes
the rest, use [Accordion](accordion.md).

## Anatomy

```html
<div id="mcr:collapsible:order">
  <div>
    <h3>Order #4189</h3>
    <button type="button" id="mct:collapsible:order" aria-expanded="false" aria-controls="mcc:collapsible:order" aria-label="Order details">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg>
    </button>
  </div>
  <dl>
    <div><dt>Status</dt><dd>Shipped</dd></div>
  </dl>
  <div id="mcc:collapsible:order" hidden>
    <dl>
      <div><dt>Shipping address</dt><dd>100 Market St, San Francisco</dd></div>
      <div><dt>Items</dt><dd>2x Studio Headphones</dd></div>
    </dl>
  </div>
</div>
```

Trigger and content can live in different parts of the document;
`aria-controls` is the only link the core follows. The
`mcr:collapsible:` root is optional and the core never reads it;
it is a hook for your own layout. Here the trigger sits in a title
row, and a summary that is always shown sits between it and the
content it opens.

## Parts

`npx monochrome add collapsible` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- `disabled` goes on the root, which renders `aria-disabled` on the
  trigger; never pass `disabled` to `Collapsible.Trigger`.
- `Collapsible.Panel` links back to its trigger only with
  `role="region"`, which makes it a named landmark.
- The root `div` only scopes the ids: inside inline content, see
  [Parts](conventions.md#parts).

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Root | `mcr:collapsible:ID` | optional; holds the trigger and the content, at any depth | nothing |
| Trigger | `mct:collapsible:ID` | `<button type="button">`, `aria-expanded`, `aria-controls` | `aria-expanded` |
| Content | `mcc:collapsible:ID` | `hidden` when closed | `hidden` |

Optional: `aria-disabled="true"` on the trigger, and
`role="region"` with `aria-labelledby` (the trigger) on the content
to make it a named landmark. To start open, set
`aria-expanded="true"` and leave `hidden` off the content.

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space | Toggle the content (native button click) |
| Tab | Move to the next focusable element |

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[id^="mct:collapsible:"][aria-expanded="true"]`: the open trigger.
- `[id^="mct:collapsible:"][aria-disabled="true"]`: a disabled trigger.
- `[id^="mcc:collapsible:"]`: the content; closed content carries
  `hidden`.
- `[id^="mcr:collapsible:"]`: the root around the trigger and the
  content.

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
/* The open trigger. */
[id^="mct:collapsible:"][aria-expanded="true"] {
  font-weight: 600;
}
/* A disabled trigger stays focusable, so show it. */
[id^="mct:collapsible:"][aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
[id^="mct:collapsible:"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Accessibility

- The trigger's text should describe the content, not the action
  alone ("Show details", not "Click here").
- `hidden` removes closed content from the tab order and the
  accessibility tree; do not add `aria-hidden`.
- The content has no role and no name by default. For a large
  section that should be named and listed as a landmark, add
  `role="region"` and `aria-labelledby` pointing at the trigger
  (`Collapsible.Panel` adds the link when you pass the role).
  `aria-labelledby` alone names nothing on a plain `div`.
- A disabled trigger stays focusable and is announced as
  unavailable.

## Design choices

- **No keyboard of its own.** Enter and Space are the button's
  native click; there is no roving between collapsibles, so each
  trigger is its own Tab stop.
- **Independent.** Opening one never closes another. For a group
  where one open section closes the rest, use
  [Accordion](accordion.md).
- **No role on the content.** Unlike an accordion, several
  collapsibles can be open at once, and a landmark for each would
  flood the landmark list. Most collapsed content is small; opt in
  with `role="region"` where a named landmark helps.

## Common mistakes

- Using a `<div>` or `<summary>` as the trigger. Fix: a
  `<button type="button">`. For a native-only disclosure without
  monochrome, `<details>` is fine on its own.
- Forgetting `hidden` on initially closed content. The core only
  flips what is there, so the first click would "close" visible
  content. Fix: `aria-expanded="false"` always pairs with `hidden`.
- Wiring the button with an `onclick` that toggles `hidden`. The
  core already does it, so the two cancel out. Fix: delete the
  handler.
- Giving the content `display: flex` or `grid`. That beats the
  browser's `hidden` rule and shows it while closed. Fix: give it a
  `display` on `:not([hidden])` only.
- An icon-only trigger without a name. Fix: `aria-label` on the
  trigger, and `aria-hidden="true"` on the icon.
- Adding `aria-labelledby` to the content without `role="region"`.
  It names nothing on a plain `div`. Fix: drop it, or add the role
  too.
