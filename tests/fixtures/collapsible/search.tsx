import { Collapsible } from "monochrome/react"

export default () => (
  <>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="search-trigger">
        Hidden searchable content
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="search-content">
        <p>UNIQUE_SEARCH_STRING_COLLAPSIBLE is hidden here</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
)
