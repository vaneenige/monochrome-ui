import { Tabs } from "monochrome/react"

export default () => (
  <>
    <Tabs.Root defaultValue="svgtab1" data-testid="svg-tabs-container">
      <Tabs.List data-testid="svg-tablist">
        <Tabs.Tab value="svgtab1" data-testid="svg-tab-1">
          <svg
            data-testid="svg-icon-1"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab value="svgtab2" data-testid="svg-tab-2">
          <svg
            data-testid="svg-icon-2"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
          Tab 2
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="svgtab1" data-testid="svg-panel-1">
        <p>SVG Tab 1 content</p>
      </Tabs.Panel>
      <Tabs.Panel value="svgtab2" data-testid="svg-panel-2">
        <p>SVG Tab 2 content</p>
      </Tabs.Panel>
    </Tabs.Root>
  </>
)
