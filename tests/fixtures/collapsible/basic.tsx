import { Collapsible } from "monochrome/react"

export default () => (
  <>
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="collapsible-trigger">
        Show more information
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="collapsible-content">
        <p>This is the hidden content that is revealed when you click the trigger.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <button type="button" data-testid="focus-after">
      Focus after
    </button>
  </>
)
