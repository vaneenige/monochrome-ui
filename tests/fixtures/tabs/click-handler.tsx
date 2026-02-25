import { Tabs } from "monochrome/react"

export default () => (
  <>
    <div id="output" data-testid="output" />
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: test fixture click tracking
      dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', (e) => {
            const item = e.target.closest('[data-action]')
            if (item) document.getElementById('output').textContent = item.dataset.action
          })
        `,
      }}
    />
    <Tabs.Root defaultValue="tab1">
      <Tabs.List>
        <Tabs.Tab value="tab1" data-testid="tab-1" data-action="tab-1-clicked">
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab value="tab2" data-testid="tab-2" data-action="tab-2-clicked">
          Tab 2
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="tab1" data-testid="panel-1">
        <p>Content 1</p>
      </Tabs.Panel>
      <Tabs.Panel value="tab2" data-testid="panel-2">
        <p>Content 2</p>
      </Tabs.Panel>
    </Tabs.Root>
  </>
)
