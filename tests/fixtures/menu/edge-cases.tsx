import { Menu } from "monochrome/react"

export default () => (
  <>
    <fieldset>
      <legend>First and last items disabled</legend>
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
    </fieldset>

    <fieldset>
      <legend>All items disabled</legend>
      <Menu.Root>
        <Menu.Trigger data-testid="all-disabled-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover data-testid="all-disabled-list">
          <Menu.Item data-testid="all-disabled-item-1" disabled>
            Item 1
          </Menu.Item>
          <Menu.Item data-testid="all-disabled-item-2" disabled>
            Item 2
          </Menu.Item>
          <Menu.Item data-testid="all-disabled-item-3" disabled>
            Item 3
          </Menu.Item>
          <Menu.Item data-testid="all-disabled-item-4" disabled>
            Item 4
          </Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </fieldset>

    <fieldset>
      <legend>No items</legend>
      <Menu.Root>
        <Menu.Trigger data-testid="no-items-trigger">MenuTrigger</Menu.Trigger>
        {/* @ts-ignore - Testing edge case with no children */}
        <Menu.Popover data-testid="no-items-list">{/* No items */}</Menu.Popover>
      </Menu.Root>
    </fieldset>
  </>
)
