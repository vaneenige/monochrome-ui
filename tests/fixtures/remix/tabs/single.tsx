/** @jsxImportSource remix/ui */
import { Tabs } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <>
      <Tabs.Root defaultValue="single">
        <Tabs.List>
          <Tabs.Tab value="single" data-testid="single-tab">
            Only Tab
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="single" data-testid="single-panel">
          <p>Content for the only tab</p>
        </Tabs.Panel>
      </Tabs.Root>
    </>
  );
}
