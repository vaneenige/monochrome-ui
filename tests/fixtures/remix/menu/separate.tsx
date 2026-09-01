/** @jsxImportSource remix/ui */
import { Menu } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <>
      <div style={{ display: "flex", gap: "200px" }}>
        <Menu.Root>
          <Menu.Trigger data-testid="menu-a-trigger">Menu A</Menu.Trigger>
          <Menu.Popover data-testid="menu-a-list">
            <Menu.Item>Item A1</Menu.Item>
            <Menu.Item>Item A2</Menu.Item>
          </Menu.Popover>
        </Menu.Root>
        <Menu.Root>
          <Menu.Trigger data-testid="menu-b-trigger">Menu B</Menu.Trigger>
          <Menu.Popover data-testid="menu-b-list">
            <Menu.Item>Item B1</Menu.Item>
            <Menu.Item>Item B2</Menu.Item>
          </Menu.Popover>
        </Menu.Root>
      </div>
    </>
  );
}
