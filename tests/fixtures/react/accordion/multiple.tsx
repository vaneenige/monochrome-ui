import { Accordion } from "monochrome/react"

export default () => (
  <>
    <Accordion.Root type="multiple" data-testid="multi-accordion">
      <Accordion.Item data-testid="multi-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="multi-trigger-1">Section A</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="multi-content-1">
          <p>Content for section A. Multiple sections can be open simultaneously.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="multi-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="multi-trigger-2">Section B</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="multi-content-2">
          <p>Content for section B. Open this while A is open.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="multi-item-3">
        <Accordion.Header>
          <Accordion.Trigger data-testid="multi-trigger-3">Section C</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="multi-content-3">
          <p>Content for section C. All three can be open at once.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
