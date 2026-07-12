import { Tabs } from "monochrome/react";

export default () => (
  <>
    <div id="output" data-testid="output" />
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Tabs.Root defaultValue="tab1">
      <Tabs.List data-testid="tablist">
        <Tabs.Tab value="tab1" data-testid="tab-1" data-action="tab-1-clicked">
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab value="tab2" data-testid="tab-2" data-action="tab-2-clicked">
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
    <Tabs.Root defaultValue="svgtab1">
      <Tabs.List>
        <Tabs.Tab value="svgtab1">
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
        <Tabs.Tab value="svgtab2">
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
);
