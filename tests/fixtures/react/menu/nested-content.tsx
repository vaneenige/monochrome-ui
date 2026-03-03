import { Collapsible, Menu } from "monochrome/react"

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
        top: var(--bottom);
        left: var(--left);
      }
    `}</style>
    <div data-testid="sidebar" style={{ width: "250px", height: "400px", overflow: "auto" }}>
      <Collapsible.Root open>
        <Collapsible.Trigger data-testid="collapsible-trigger">Section</Collapsible.Trigger>
        <Collapsible.Panel data-testid="collapsible-panel">
          <Menu.Root className="menu">
            <Menu.Trigger data-testid="nested-menu-trigger">Nested Menu</Menu.Trigger>
            <Menu.Popover data-testid="nested-menu-list">
              <Menu.Item data-testid="nested-menu-item-1">Item 1</Menu.Item>
              <Menu.Item data-testid="nested-menu-item-2">Item 2</Menu.Item>
              <Menu.Item data-testid="nested-menu-item-3">Item 3</Menu.Item>
            </Menu.Popover>
          </Menu.Root>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  </>
)
