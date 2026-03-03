import { Collapsible } from "monochrome/react"

export default () => (
  <>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="focusable-trigger">
        Toggle focusable content
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="focusable-content">
        <p>This content has focusable elements:</p>
        <input type="text" data-testid="focusable-input" placeholder="Input field" />
        {/* biome-ignore lint/a11y/useValidAnchor: Test fixture for focusable element */}
        <a href="#" data-testid="focusable-link">
          A link
        </a>
        <button type="button" data-testid="focusable-button">
          A button
        </button>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="rich-trigger">Show Details</Collapsible.Trigger>
      <Collapsible.Panel data-testid="rich-content">
        <h4>Detailed Information</h4>
        <p>This collapsible contains various HTML elements:</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
        <button type="button" data-testid="rich-content-button">
          Button inside collapsible
        </button>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
)
