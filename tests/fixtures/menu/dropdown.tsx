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
        top: var(--bottom);
        left: var(--left);
      }
      [role="menu"] [role="menu"] {
        top: var(--top);
        left: var(--right);
        margin-left: 16px;
      }
    `}</style>
    <div
      data-testid="scroll-container"
      style={{
        width: "200px",
        height: "200px",
        overflow: "auto",
      }}
    >
      <div style={{ height: "1000px", width: "100%" }}>
        Scroll me! <br />
        {Array.from({ length: 20 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Test fixture scroll content
          <div key={i}>Item {i + 1}</div>
        ))}
      </div>
    </div>
    <div>
      <button type="button" data-testid="focus-before">
        Focus before
      </button>
      <Menu.Root className="menu">
        <Menu.Trigger data-testid="root-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover data-testid="root-list">
          <Menu.Item data-testid="root-item-1">MenuItem 1</Menu.Item>
          <Menu.Item data-testid="root-item-2">MenuItem 2</Menu.Item>
          <Menu.Item data-testid="root-item-3">MenuItem 3</Menu.Item>
          <Menu.Group>
            <Menu.Trigger data-testid="root-submenu-trigger">Submenu Trigger</Menu.Trigger>
            <Menu.Popover data-testid="root-submenu-list">
              <Menu.Item data-testid="root-submenu-item-1">Submenu Item 1</Menu.Item>
              <Menu.Item data-testid="root-submenu-item-2">Submenu Item 2</Menu.Item>
              <Menu.Item data-testid="root-submenu-item-3">Submenu Item 3</Menu.Item>
            </Menu.Popover>
          </Menu.Group>
        </Menu.Popover>
      </Menu.Root>
      <button type="button" data-testid="focus-after">
        Focus after
      </button>
      <Menu.Root className="menu">
        <Menu.Trigger data-testid="second-trigger">Second Menu</Menu.Trigger>
        <Menu.Popover data-testid="second-list">
          <Menu.Item data-testid="second-item-1">Second Item 1</Menu.Item>
          <Menu.Item data-testid="second-item-2">Second Item 2</Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </div>
  </>
)
