import { Menu } from "monochrome/react"

export default () => (
  <div style={{ padding: "2rem" }}>
    <fieldset>
      <legend>Menubar</legend>
      <Menu.Root menubar>
        <Menu.Popover data-testid="menubar-list">
          <Menu.Group>
            <Menu.Trigger data-testid="menubar-trigger-1">MenuTrigger 1</Menu.Trigger>
            <Menu.Popover data-testid="menubar-list-1">
              <Menu.Item data-testid="menubar-item-1-1">MenuItem 1.1</Menu.Item>
              <Menu.Item data-testid="menubar-item-1-2">MenuItem 1.2</Menu.Item>
              <Menu.Item data-testid="menubar-item-1-3">MenuItem 1.3</Menu.Item>
              <Menu.Group>
                <Menu.Trigger data-testid="menubar-submenu-trigger-1">Submenu 1</Menu.Trigger>
                <Menu.Popover data-testid="menubar-submenu-list-1">
                  <Menu.Item data-testid="menubar-submenu-item-1-1">Submenu Item 1.1</Menu.Item>
                  <Menu.Item data-testid="menubar-submenu-item-1-2">Submenu Item 1.2</Menu.Item>
                </Menu.Popover>
              </Menu.Group>
            </Menu.Popover>
          </Menu.Group>
          <Menu.Item data-testid="menubar-item-1">MenuItem 1</Menu.Item>
          <Menu.Group>
            <Menu.Trigger data-testid="menubar-trigger-2">MenuTrigger 2</Menu.Trigger>
            <Menu.Popover data-testid="menubar-list-2">
              <Menu.Item data-testid="menubar-item-2-1">MenuItem 2.1</Menu.Item>
              <Menu.Item data-testid="menubar-item-2-2">MenuItem 2.2</Menu.Item>
              <Menu.Item data-testid="menubar-item-2-3">MenuItem 2.3</Menu.Item>
              <Menu.Group>
                <Menu.Trigger data-testid="menubar-submenu-trigger-2">Submenu 2</Menu.Trigger>
                <Menu.Popover data-testid="menubar-submenu-list-2">
                  <Menu.Item data-testid="menubar-submenu-item-2-1">Submenu Item 2.1</Menu.Item>
                  <Menu.Item data-testid="menubar-submenu-item-2-2">Submenu Item 2.2</Menu.Item>
                </Menu.Popover>
              </Menu.Group>
            </Menu.Popover>
          </Menu.Group>
          <Menu.Group>
            <Menu.Trigger data-testid="menubar-trigger-3">MenuTrigger 3</Menu.Trigger>
            <Menu.Popover data-testid="menubar-list-3">
              <Menu.Item data-testid="menubar-item-3-1">MenuItem 3.1</Menu.Item>
              <Menu.Item data-testid="menubar-item-3-2">MenuItem 3.2</Menu.Item>
              <Menu.Item data-testid="menubar-item-3-3">MenuItem 3.3</Menu.Item>
              <Menu.Group>
                <Menu.Trigger data-testid="menubar-submenu-trigger-3">Submenu 3</Menu.Trigger>
                <Menu.Popover data-testid="menubar-submenu-list-3">
                  <Menu.Item data-testid="menubar-submenu-item-3-1">Submenu Item 3.1</Menu.Item>
                  <Menu.Item data-testid="menubar-submenu-item-3-2">Submenu Item 3.2</Menu.Item>
                </Menu.Popover>
              </Menu.Group>
            </Menu.Popover>
          </Menu.Group>
        </Menu.Popover>
      </Menu.Root>
    </fieldset>
  </div>
)
