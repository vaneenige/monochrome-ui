import { Tabs } from "monochrome/react"

export default () => (
  <>
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Tabs.Root defaultValue="tab1" data-testid="tabs-container">
      <Tabs.List data-testid="tablist">
        <Tabs.Tab value="tab1" data-testid="nf-tab-1">
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab value="tab2" data-testid="nf-tab-2">
          Tab 2
        </Tabs.Tab>
        <Tabs.Tab value="tab3" data-testid="nf-tab-3">
          Tab 3
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="tab1" focusable={false} data-testid="nf-panel-1">
        <p>Content for Tab 1</p>
        <button type="button" data-testid="nf-button-1">
          Button in panel 1
        </button>
      </Tabs.Panel>
      <Tabs.Panel value="tab2" focusable={false} data-testid="nf-panel-2">
        <p>Content for Tab 2</p>
        <button type="button" data-testid="nf-button-2">
          Button in panel 2
        </button>
      </Tabs.Panel>
      <Tabs.Panel value="tab3" focusable={false} data-testid="nf-panel-3">
        <p>Content for Tab 3</p>
        <button type="button" data-testid="nf-button-3">
          Button in panel 3
        </button>
      </Tabs.Panel>
    </Tabs.Root>
    <button type="button" data-testid="focus-after">
      Focus after
    </button>
  </>
)
