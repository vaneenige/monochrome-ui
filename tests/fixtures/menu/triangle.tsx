import { Menu } from "monochrome/react"

export default () => (
  <>
    <style>{`
      .menu {
        position: relative;
        display: inline-block;
      }
      [role="menu"] {
        position: fixed;
        inset: auto;
        margin: 0;
        min-width: 160px;
        top: var(--bottom);
        left: var(--left);
      }
      [role="menu"] [role="menu"] {
        top: var(--top);
        left: var(--right);
        margin-left: 16px;
      }
    `}</style>
    <Menu.Root className="menu">
      <Menu.Trigger data-testid="trigger">Menu</Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.Item data-testid="item-1">Item 1</Menu.Item>
        <Menu.Item data-testid="item-2">Item 2</Menu.Item>
        <Menu.Group data-testid="group">
          <Menu.Trigger data-testid="submenu-trigger">Submenu</Menu.Trigger>
          <Menu.Popover data-testid="submenu-list">
            <Menu.Item data-testid="submenu-item-1">Sub Item 1</Menu.Item>
            <Menu.Item data-testid="submenu-item-2">Sub Item 2</Menu.Item>
          </Menu.Popover>
        </Menu.Group>
      </Menu.Popover>
    </Menu.Root>
  </>
)
