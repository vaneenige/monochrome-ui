import { Collapsible } from "monochrome/react"

export default () => (
  <>
    <Collapsible.Root open>
      <Collapsible.Trigger data-testid="open-collapsible-trigger">
        Hide information
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="open-collapsible-content">
        <p>This content is visible by default and can be hidden.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
)
