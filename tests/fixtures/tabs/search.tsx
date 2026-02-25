import { Tabs } from "monochrome/react"

export default () => (
  <>
    <Tabs.Root defaultValue="search1" data-testid="search-tabs-container">
      <Tabs.List data-testid="search-tablist">
        <Tabs.Tab value="search1" data-testid="search-tab-1">
          Search Tab 1
        </Tabs.Tab>
        <Tabs.Tab value="search2" data-testid="search-tab-2">
          Search Tab 2
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="search1" data-testid="search-panel-1">
        <p>First panel content</p>
      </Tabs.Panel>
      <Tabs.Panel value="search2" data-testid="search-panel-2">
        <p>UNIQUE_SEARCH_STRING_TABS hidden in second panel</p>
      </Tabs.Panel>
    </Tabs.Root>
  </>
)
