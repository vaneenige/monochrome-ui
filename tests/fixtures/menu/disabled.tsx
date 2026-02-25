import { Menu } from "monochrome/react"

export default () => (
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
  </>
)
