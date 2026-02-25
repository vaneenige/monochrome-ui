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
  </>
)
