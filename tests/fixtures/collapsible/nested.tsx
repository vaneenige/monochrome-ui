import { Collapsible } from "monochrome/react"

export default () => (
  <>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="outer-trigger">Outer Collapsible</Collapsible.Trigger>
      <Collapsible.Panel data-testid="outer-content">
        <p>Outer content with nested collapsible:</p>
        <Collapsible.Root>
          <Collapsible.Trigger data-testid="inner-trigger">Inner Collapsible</Collapsible.Trigger>
          <Collapsible.Panel data-testid="inner-content">
            <p>Inner content revealed</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
)
