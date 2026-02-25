import { Menu } from "monochrome/react"

export default () => (
  <>
    <Menu.Root>
      <Menu.Trigger data-testid="svg-trigger">
        <svg data-testid="svg-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" />
        </svg>
        Menu with SVG
      </Menu.Trigger>
      <Menu.Popover data-testid="svg-list">
        <Menu.Item data-testid="svg-item-1">SVG Menu Item 1</Menu.Item>
        <Menu.Item data-testid="svg-item-2">SVG Menu Item 2</Menu.Item>
      </Menu.Popover>
    </Menu.Root>
  </>
)
