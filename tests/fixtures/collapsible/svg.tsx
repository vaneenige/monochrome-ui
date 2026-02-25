import { Collapsible } from "monochrome/react"

export default () => (
  <>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="svg-trigger">
        <svg data-testid="svg-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" />
        </svg>
        Toggle with SVG
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="svg-content">
        <p>Content revealed by clicking the SVG icon</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
)
