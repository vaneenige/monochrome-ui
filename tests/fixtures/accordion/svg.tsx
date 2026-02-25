import { Accordion } from "monochrome/react"

export default () => (
  <>
    <Accordion.Root type="single" data-testid="svg-accordion">
      <Accordion.Item data-testid="svg-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="svg-trigger-1">
            <svg
              data-testid="svg-icon-1"
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
            Section with SVG
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="svg-content-1">
          <p>Content revealed by clicking the SVG icon</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
