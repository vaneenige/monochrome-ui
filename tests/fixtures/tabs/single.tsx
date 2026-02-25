import { Tabs } from "monochrome/react"

export default () => (
  <>
    <Tabs.Root defaultValue="single" data-testid="single-tab-container">
      <Tabs.List data-testid="single-tablist">
        <Tabs.Tab value="single" data-testid="single-tab">
          Only Tab
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="single" data-testid="single-panel">
        <p>Content for the only tab</p>
      </Tabs.Panel>
    </Tabs.Root>
  </>
)
