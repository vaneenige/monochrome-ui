/** @jsxImportSource remix/ui */
import { Menu } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <Menu.Root>
      <Menu.Trigger data-testid="trigger" disabled>
        MenuTrigger
      </Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.Item data-testid="item-1">Item 1</Menu.Item>
        <Menu.Item data-testid="item-2">Item 2</Menu.Item>
      </Menu.Popover>
    </Menu.Root>
  );
}
