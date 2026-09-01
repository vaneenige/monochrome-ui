/** @jsxImportSource remix/ui */
import { Menu } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <>
      <Menu.Root>
        <Menu.Trigger data-testid="disabled-first-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover data-testid="disabled-first-list">
          <Menu.Item data-testid="disabled-first-item-1" disabled>
            Item 1
          </Menu.Item>
          <Menu.Item data-testid="disabled-first-item-2">Item 2</Menu.Item>
          <Menu.Item data-testid="disabled-first-item-3">Item 3</Menu.Item>
          <Menu.Item data-testid="disabled-first-item-4" disabled>
            Item 4
          </Menu.Item>
        </Menu.Popover>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger data-testid="all-disabled-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover data-testid="all-disabled-list">
          <Menu.Item disabled>Item 1</Menu.Item>
          <Menu.Item disabled>Item 2</Menu.Item>
          <Menu.Item disabled>Item 3</Menu.Item>
          <Menu.Item disabled>Item 4</Menu.Item>
        </Menu.Popover>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger data-testid="no-items-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover>{null}</Menu.Popover>
      </Menu.Root>
    </>
  );
}
