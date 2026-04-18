import { Menu, Popover, Tooltip } from "monochrome/react"

export default () => (
  <>
    <style>{`
      .tooltip { position: relative; display: inline-block; }
      .popover { position: relative; display: inline-block; }
      .menu { position: relative; display: inline-block; }
      [popover] { position: fixed; inset: auto; margin: 0; top: var(--bottom); left: var(--left); }
      [role="tooltip"] { pointer-events: none; }
    `}</style>
    <div id="output" data-testid="output" />
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Tooltip.Root className="tooltip">
      <Tooltip.Trigger data-testid="tooltip-trigger" data-action="trigger-clicked">
        Hover me
      </Tooltip.Trigger>
      <Tooltip.Content data-testid="tooltip-content">Tooltip text</Tooltip.Content>
    </Tooltip.Root>
    <button type="button" data-testid="focus-between">
      Focus between
    </button>
    <Tooltip.Root className="tooltip">
      <Tooltip.Trigger data-testid="second-trigger">Second</Tooltip.Trigger>
      <Tooltip.Content data-testid="second-content">Second tooltip</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root className="tooltip">
      <Tooltip.Trigger data-testid="disabled-trigger" aria-disabled="true">
        Disabled
      </Tooltip.Trigger>
      <Tooltip.Content data-testid="disabled-content">Disabled tooltip</Tooltip.Content>
    </Tooltip.Root>
    <Popover.Root className="popover">
      <Popover.Trigger data-testid="popover-trigger">Popover</Popover.Trigger>
      <Popover.Content data-testid="popover-content">
        <p>Popover content</p>
      </Popover.Content>
    </Popover.Root>
    <Menu.Root className="menu">
      <Menu.Trigger data-testid="menu-trigger">Menu</Menu.Trigger>
      <Menu.Popover data-testid="menu-list">
        <Menu.Item data-testid="menu-item-1">Menu Item 1</Menu.Item>
      </Menu.Popover>
    </Menu.Root>
  </>
)
