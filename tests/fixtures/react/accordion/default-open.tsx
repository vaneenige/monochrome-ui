import { Accordion } from "monochrome/react"

export default () => (
  <>
    <Accordion.Root type="single" data-testid="default-open-accordion">
      <Accordion.Item data-testid="default-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="default-trigger-1">Closed Section</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="default-content-1">
          <p>This section is closed by default.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item open data-testid="default-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="default-trigger-2">
            Open Section (default)
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="default-content-2">
          <p>This section is open by default.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="default-item-3">
        <Accordion.Header>
          <Accordion.Trigger data-testid="default-trigger-3">
            Another Closed Section
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="default-content-3">
          <p>This section is also closed by default.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
