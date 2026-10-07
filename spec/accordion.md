---
title: Accordion
description: A stack of headed sections where opening one closes the others.
---

# Accordion

An accordion is a vertical stack of headings, each a button that
shows or hides the section below it. Opening a section closes
whichever other section in the same accordion is open, so at most
one is open at a time. It implements the WAI-ARIA Accordion pattern
with ArrowDown, ArrowUp, Home, and End moving between headers. For
sections that open independently, use
[Collapsible](collapsible.md).

## Anatomy

```html
<div id="mcr:accordion:faq">
  <div>
    <h3>
      <button type="button" id="mct:accordion:faq-1" aria-expanded="true" aria-controls="mcc:accordion:faq-1">
        What is monochrome?
      </button>
    </h3>
    <div role="region" id="mcc:accordion:faq-1" aria-labelledby="mct:accordion:faq-1">
      <p>Accessible, HTML-first components driven by ARIA attributes.</p>
    </div>
  </div>
  <div>
    <h3>
      <button type="button" id="mct:accordion:faq-2" aria-expanded="false" aria-controls="mcc:accordion:faq-2">
        Does it need a framework?
      </button>
    </h3>
    <div role="region" id="mcc:accordion:faq-2" aria-labelledby="mct:accordion:faq-2" hidden>
      <p>No. Plain HTML works; the React and Vue parts render the same markup.</p>
    </div>
  </div>
  <div>
    <h3>
      <button type="button" id="mct:accordion:faq-3" aria-expanded="false" aria-controls="mcc:accordion:faq-3" aria-disabled="true">
        Coming soon
      </button>
    </h3>
    <div role="region" id="mcc:accordion:faq-3" aria-labelledby="mct:accordion:faq-3" hidden>
      <p>Disabled sections stay closed and are skipped by the arrow keys.</p>
    </div>
  </div>
</div>
```

Each direct child of the root is an item. The core finds an item's
trigger by following first element children down from the item
(item, then heading, then button), so the heading must be the
item's first element and the button the heading's first element.
The panel can be anywhere; the usual place is right after the
heading.

## Parts

`npx monochrome add accordion` writes parts that render this
markup, in React or Vue; the example it prints shows them in use.
What they share: [Parts](conventions.md#parts).

- `disabled` goes on the item, which renders `aria-disabled` on its
  trigger; never pass `disabled` to `Accordion.Trigger`.
- Give `defaultOpen` to one item at most: two start open and stay
  open until another section opens.
- `Accordion.Header` renders an `h3`; `as` picks another level
  (`h2` to `h6`).

## Contract

| Element | Id pattern | Required attributes | Written by core |
| --- | --- | --- | --- |
| Root | `mcr:accordion:ID` | none | nothing |
| Item | none | direct child of the root | nothing |
| Heading | none | `h2` to `h6`, first element of the item | nothing |
| Trigger | `mct:accordion:ID` | `<button type="button">`, `aria-expanded`, `aria-controls` | `aria-expanded` |
| Panel | `mcc:accordion:ID` | `role="region"`, `aria-labelledby` (the trigger), `hidden` when closed | `hidden` |

Optional: `aria-disabled="true"` on a trigger.

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space | Toggle the focused section (native button click) |
| ArrowDown | Focus the next enabled header, wrapping to the first |
| ArrowUp | Focus the previous enabled header, wrapping to the last |
| Home | Focus the first enabled header |
| End | Focus the last enabled header |
| ArrowLeft, ArrowRight | Nothing, and the page does not scroll |
| Tab | Move to the next focusable element (into an open panel) |

The arrow keys skip disabled and hidden headers.

## Styling

monochrome ships no CSS: style these hooks with the project's own
styles ([How to style](styling.md)).

- `[id^="mct:accordion:"][aria-expanded="true"]`: the open header.
- `[id^="mct:accordion:"][aria-disabled="true"]`: a disabled header.
- `[id^="mcc:accordion:"]`: a panel; closed panels carry `hidden`.
- `[id^="mcr:accordion:"]`: the frame around the items.

### Example

Every state styled once, in plain CSS. Keep the selectors; the
values are the project's.

```css
/* The open header. */
[id^="mct:accordion:"][aria-expanded="true"] {
  font-weight: 600;
}
/* A disabled header stays focusable, so show it. */
[id^="mct:accordion:"][aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
[id^="mct:accordion:"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
```

## Accessibility

- Wrap every trigger in a heading at the level that fits the page
  outline. The heading gives screen reader users a way to jump
  between sections.
- Each panel is a `role="region"` named by its trigger through
  `aria-labelledby`, so a reader moving into it hears which section
  it is, and the open section shows in the landmark list. The core
  never reads that link; it follows `aria-controls` only.
- A disabled header stays focusable and announced as unavailable.
- Closed panels use `hidden`, so their content is out of the tab
  order and the accessibility tree without `aria-hidden`.

## Design choices

- **One open at a time, always.** There is no multi-open mode.
  Sections that open independently are
  [Collapsible](collapsible.md) components.
- **Every section can close.** Pressing the open header closes it
  and leaves all sections closed. APG allows either; folding back
  a section opened by mistake should work.
- **Every panel is a region.** APG makes the role optional and
  warns against a landmark per section when many can be open.
  Here only one panel is open at a time and closed panels are
  `hidden`, so an accordion adds at most one landmark.
- **Arrows only move focus.** ArrowDown and ArrowUp never open a
  section; Enter or Space does, so moving through the headers
  never opens and closes sections on the way.

## Common mistakes

- Wrapping items in an extra element. Items must be direct
  children of the `mcr:accordion:` root; otherwise exclusivity and
  arrow keys skip them. Fix: remove the wrapper, or move the root
  id onto it.
- Putting an icon or label before the heading inside an item. The
  trigger is found through the first element chain. Fix: keep the
  heading first and put decoration inside the button.
- Expecting several sections open at once. Opening one always
  closes the others in the same root. Fix: use separate
  [Collapsible](collapsible.md) components.
- Marking a panel open with `aria-expanded="true"` but leaving
  `hidden` on it (or the reverse). Fix: `aria-expanded="true"`
  means no `hidden`; `"false"` means `hidden`.
- Giving panels `display: flex` or `grid`. That beats the browser's
  `hidden` rule and shows closed panels. Fix: give it a `display` on
  `:not([hidden])` only.
- Using `disabled` on the trigger. Fix: `aria-disabled="true"`.
- Leaving `role="region"` or `aria-labelledby` off a panel. The
  core still opens it, but screen readers lose the section name.
  Fix: both, on every panel.
