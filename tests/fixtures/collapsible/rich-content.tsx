import { Collapsible } from "monochrome/react"

export default () => (
  <>
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
