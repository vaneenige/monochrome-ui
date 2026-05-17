import { Menu, Popover } from "monochrome/react";

export default () => (
	<>
		<style>{`
      .popover { position: relative; display: inline-block; }
      [popover] { position: fixed; inset: auto; margin: 0; top: var(--bottom); left: var(--left); }
      .scrollable-content { width: 200px; height: 80px; overflow: auto; }
      .scrollable-content > div { height: 400px; }
    `}</style>
		<div id="output" data-testid="output" />
		<button type="button" data-testid="focus-before">
			Focus before
		</button>
		<Popover.Root className="popover">
			<Popover.Trigger
				data-testid="click-trigger"
				data-action="trigger-clicked"
			>
				Open
			</Popover.Trigger>
			<Popover.Content data-testid="click-content">
				<p data-testid="click-text">Click content</p>
				<button
					type="button"
					data-testid="copy-button"
					data-action="copy-clicked"
				>
					Copy
				</button>
			</Popover.Content>
		</Popover.Root>
		<button type="button" data-testid="focus-after">
			Focus after
		</button>
		<Popover.Root className="popover">
			<Popover.Trigger data-testid="second-trigger">Second</Popover.Trigger>
			<Popover.Content data-testid="second-content">
				<p>Second content</p>
			</Popover.Content>
		</Popover.Root>
		<Popover.Root className="popover">
			<Popover.Trigger data-testid="disabled-trigger" aria-disabled="true">
				Disabled
			</Popover.Trigger>
			<Popover.Content data-testid="disabled-content">
				<p>Disabled content</p>
			</Popover.Content>
		</Popover.Root>
		<Popover.Root className="popover">
			<Popover.Trigger data-testid="scroll-trigger">Scroll</Popover.Trigger>
			<Popover.Content data-testid="scroll-content">
				<div data-testid="scroll-inner" className="scrollable-content">
					<div>Long content to scroll through</div>
				</div>
			</Popover.Content>
		</Popover.Root>
		<Popover.Root className="popover">
			<Popover.Trigger data-testid="described-trigger">
				Described
			</Popover.Trigger>
			<Popover.Content data-testid="described-content">
				<Popover.Description data-testid="described-desc">
					A short description for AT.
				</Popover.Description>
				<button type="button" data-testid="described-action">
					Action
				</button>
			</Popover.Content>
		</Popover.Root>
		<Popover.Root className="popover">
			<Popover.Trigger data-testid="dialog-popover-trigger">
				Open dialog popover
			</Popover.Trigger>
			<Popover.Content
				data-testid="dialog-popover-content"
				role="dialog"
				aria-label="Filter results"
			>
				<Popover.Title data-testid="dialog-popover-title">
					Filter results
				</Popover.Title>
				<Popover.Description data-testid="dialog-popover-desc">
					Pick a date range.
				</Popover.Description>
				<button type="button" data-testid="dialog-popover-apply">
					Apply
				</button>
			</Popover.Content>
		</Popover.Root>
		<Popover.Root className="popover">
			<Popover.Trigger data-testid="aria-label-trigger">Plain</Popover.Trigger>
			<Popover.Content data-testid="aria-label-content" aria-label="Quick info">
				<p>Just a label.</p>
			</Popover.Content>
		</Popover.Root>
		<Menu.Root>
			<Menu.Trigger data-testid="menu-trigger">Menu</Menu.Trigger>
			<Menu.Popover data-testid="menu-list">
				<Menu.Item data-testid="menu-item-1">Menu Item 1</Menu.Item>
			</Menu.Popover>
		</Menu.Root>
	</>
);
