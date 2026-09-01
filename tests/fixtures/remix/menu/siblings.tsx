/** @jsxImportSource remix/ui */
import { Menu } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <>
      <Menu.Root>
        <Menu.Trigger data-testid="trigger">File</Menu.Trigger>
        <Menu.Popover data-testid="list">
          <Menu.Item data-testid="item-new">New file</Menu.Item>
          <Menu.Group>
            <Menu.Trigger data-testid="share-trigger">Share</Menu.Trigger>
            <Menu.Popover data-testid="share-list">
              <Menu.Item data-testid="share-item-1">Copy link</Menu.Item>
              <Menu.Item>Invite…</Menu.Item>
            </Menu.Popover>
          </Menu.Group>
          <Menu.Group>
            <Menu.Trigger data-testid="export-trigger">Export</Menu.Trigger>
            <Menu.Popover data-testid="export-list">
              <Menu.Item data-testid="export-item-1">PNG</Menu.Item>
              <Menu.Item>SVG</Menu.Item>
            </Menu.Popover>
          </Menu.Group>
        </Menu.Popover>
      </Menu.Root>
    </>
  );
}
