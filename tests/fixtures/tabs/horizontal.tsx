import { Tabs } from "monochrome/react"

export default () => (
  <>
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Tabs.Root defaultValue="tab1" data-testid="tabs-container">
      <Tabs.List data-testid="tablist">
        <Tabs.Tab value="tab1" data-testid="tab-1">
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab value="tab2" data-testid="tab-2">
          Tab 2
        </Tabs.Tab>
        <Tabs.Tab value="tab3" data-testid="tab-3">
          Tab 3
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="tab1" data-testid="panel-1">
        <p>Content for Tab 1</p>
      </Tabs.Panel>
      <Tabs.Panel value="tab2" data-testid="panel-2">
        <p>Content for Tab 2</p>
      </Tabs.Panel>
      <Tabs.Panel value="tab3" data-testid="panel-3">
        <p>Content for Tab 3</p>
      </Tabs.Panel>
    </Tabs.Root>
    <button type="button" data-testid="focus-after">
      Focus after
    </button>
  </>
)
