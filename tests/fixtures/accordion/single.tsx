import { Accordion } from "monochrome/react"

export default () => (
  <>
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Accordion.Root type="single" data-testid="single-accordion">
      <Accordion.Item data-testid="single-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="single-trigger-1">Section 1</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="single-content-1">
          <p>Content for section 1. When you open another section, this one closes.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="single-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="single-trigger-2">Section 2</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="single-content-2">
          <p>Content for section 2. Only one section can be open at a time.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="single-item-3">
        <Accordion.Header>
          <Accordion.Trigger data-testid="single-trigger-3">Section 3</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="single-content-3">
          <p>Content for section 3. This is the last section.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
    <button type="button" data-testid="focus-after">
      Focus after
    </button>
  </>
)
