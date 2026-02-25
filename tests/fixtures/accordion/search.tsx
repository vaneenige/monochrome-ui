import { Accordion } from "monochrome/react"

export default () => (
  <>
    <Accordion.Root type="single" data-testid="search-accordion">
      <Accordion.Item data-testid="search-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="search-trigger-1">First Section</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="search-content-1">
          <p>Regular content here</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="search-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="search-trigger-2">
            Hidden Searchable Content
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="search-content-2">
          <p>UNIQUE_SEARCH_STRING_ACCORDION is hidden here</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
