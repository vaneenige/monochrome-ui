import { Collapsible } from "monochrome/react"

export default () => (
  <Collapsible.Root>
    <div>
      <p>Trigger is here:</p>
      <Collapsible.Trigger data-testid="separated-trigger">
        Toggle remote content
      </Collapsible.Trigger>
    </div>
    <div>
      <p>Content is in a different DOM subtree:</p>
      <Collapsible.Panel data-testid="separated-content">
        <p>This content is not a sibling of the trigger. It lives in a separate DOM subtree.</p>
      </Collapsible.Panel>
    </div>
  </Collapsible.Root>
)
