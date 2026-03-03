import { Accordion } from "monochrome/react"

export default () => (
  <>
    <Accordion.Root type="single" data-testid="outer-accordion">
      <Accordion.Item data-testid="outer-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="outer-trigger-1">Outer Section 1</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="outer-content-1">
          <p>Outer content with nested accordion:</p>
          <Accordion.Root type="single" data-testid="nested-accordion">
            <Accordion.Item data-testid="nested-item-1">
              <Accordion.Header>
                <Accordion.Trigger data-testid="nested-trigger-1">
                  Nested Section A
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel data-testid="nested-content-1">
                <p>Nested content A</p>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item data-testid="nested-item-2">
              <Accordion.Header>
                <Accordion.Trigger data-testid="nested-trigger-2">
                  Nested Section B
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel data-testid="nested-content-2">
                <p>Nested content B</p>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="outer-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="outer-trigger-2">Outer Section 2</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="outer-content-2">
          <p>Regular outer content</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
