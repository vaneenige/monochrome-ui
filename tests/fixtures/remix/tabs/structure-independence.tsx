/** @jsxImportSource remix/ui */
import { Tabs } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <Tabs.Root defaultValue="t1">
      <header>
        <Tabs.List data-testid="tablist">
          <Tabs.Tab value="t1" data-testid="tab-1">
            Tab 1
          </Tabs.Tab>
          <Tabs.Tab value="t2" data-testid="tab-2">
            Tab 2
          </Tabs.Tab>
        </Tabs.List>
      </header>
      <main data-testid="main">
        <p>Unrelated chrome between the tablist and its panels.</p>
      </main>
      <aside>
        <Tabs.Panel value="t1" data-testid="panel-1">
          <p>Panel 1 content</p>
        </Tabs.Panel>
        <Tabs.Panel value="t2" data-testid="panel-2">
          <p>Panel 2 content</p>
        </Tabs.Panel>
      </aside>
    </Tabs.Root>
  );
}
