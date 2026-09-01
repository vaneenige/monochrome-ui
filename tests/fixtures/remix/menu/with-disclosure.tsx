/** @jsxImportSource remix/ui */
import { Collapsible, Menu } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <>
      <Menu.Root>
        <Menu.Trigger data-testid="menu-trigger">Menu</Menu.Trigger>
        <Menu.Popover data-testid="menu-list">
          <Menu.Item data-testid="menu-item-1">Item 1</Menu.Item>
          <Menu.Item>Item 2</Menu.Item>
        </Menu.Popover>
      </Menu.Root>
      <Collapsible.Root>
        <Collapsible.Trigger data-testid="disclosure-trigger">Disclosure</Collapsible.Trigger>
        <Collapsible.Panel data-testid="disclosure-content">
          <p>Disclosure panel</p>
        </Collapsible.Panel>
      </Collapsible.Root>
    </>
  );
}
