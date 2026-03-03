import { Accordion } from "monochrome/react"

export default () => (
  <>
    <Accordion.Root type="single" data-testid="single-item-accordion">
      <Accordion.Item data-testid="only-item">
        <Accordion.Header>
          <Accordion.Trigger data-testid="only-trigger">Only Section</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="only-content">
          <p>This is the only section in this accordion.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
