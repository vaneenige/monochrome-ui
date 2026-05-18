import { Dialog, Menu, Popover, Tabs, Tooltip } from "monochrome/react";

export default () => (
	<>
		<div id="output" data-testid="output" />
		<button type="button" data-testid="focus-before">
			Focus before
		</button>

		<Dialog.Root>
			<Dialog.Trigger data-testid="primary-trigger">
				Open primary
			</Dialog.Trigger>
			<Dialog.Content data-testid="primary-content">
				<Dialog.Title data-testid="primary-title">Confirm action</Dialog.Title>
				<Dialog.Description data-testid="primary-desc">
					This cannot be undone.
				</Dialog.Description>
				<Dialog.Close data-testid="primary-close">Cancel</Dialog.Close>
				<button type="button" data-testid="primary-action">
					Delete
				</button>
			</Dialog.Content>
		</Dialog.Root>

		<button type="button" data-testid="focus-after">
			Focus after
		</button>

		<Dialog.Root>
			<Dialog.Trigger data-testid="autofocus-trigger">
				Open autofocus
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Autofocus</Dialog.Title>
				<Dialog.Description>Body</Dialog.Description>
				<Dialog.Close>First</Dialog.Close>
				{/* biome-ignore lint/a11y/noAutofocus: WAI-ARIA recommends autofocus inside dialogs */}
				<button type="button" data-testid="autofocus-target" autoFocus>
					Second
				</button>
			</Dialog.Content>
		</Dialog.Root>

		<Dialog.Root>
			<Dialog.Trigger>Open alert</Dialog.Trigger>
			<Dialog.Content data-testid="alert-content" role="alertdialog">
				<Dialog.Title>Alert</Dialog.Title>
				<Dialog.Description>Important message</Dialog.Description>
				<Dialog.Close>OK</Dialog.Close>
			</Dialog.Content>
		</Dialog.Root>

		<Dialog.Root>
			<Dialog.Trigger data-testid="disabled-trigger" aria-disabled="true">
				Disabled
			</Dialog.Trigger>
			<Dialog.Content data-testid="disabled-content">
				<Dialog.Title>Should not open</Dialog.Title>
				<Dialog.Description>Disabled</Dialog.Description>
				<Dialog.Close>Close</Dialog.Close>
			</Dialog.Content>
		</Dialog.Root>

		<Dialog.Root>
			<Dialog.Trigger data-testid="bare-trigger">Open bare</Dialog.Trigger>
			<Dialog.Content data-testid="bare-content" aria-label="Quick choice">
				<Dialog.Close>Close</Dialog.Close>
			</Dialog.Content>
		</Dialog.Root>

		<Dialog.Root>
			<Dialog.Trigger data-testid="tabs-dialog-trigger">
				Open tabs dialog
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Tabs dialog</Dialog.Title>
				<Dialog.Description>
					Switching tabs should update the focus trap.
				</Dialog.Description>
				<Dialog.Close data-testid="tabs-dialog-close">Close</Dialog.Close>
				<Tabs.Root defaultValue="t1">
					<Tabs.List>
						<Tabs.Tab value="t1" data-testid="t1-trigger">
							T1
						</Tabs.Tab>
						<Tabs.Tab value="t2" data-testid="t2-trigger">
							T2
						</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel value="t1" focusable={false}>
						<input data-testid="t1-input" />
					</Tabs.Panel>
					<Tabs.Panel value="t2" focusable={false}>
						<a data-testid="t2-link" href="/link">
							Link
						</a>
					</Tabs.Panel>
				</Tabs.Root>
			</Dialog.Content>
		</Dialog.Root>

		<Popover.Root className="popover">
			<Popover.Trigger data-testid="popover-trigger">Popover</Popover.Trigger>
			<Popover.Content data-testid="popover-content">
				<p>Popover content</p>
			</Popover.Content>
		</Popover.Root>

		<Menu.Root>
			<Menu.Trigger data-testid="menu-trigger">Menu</Menu.Trigger>
			<Menu.Popover data-testid="menu-list">
				<Menu.Item>Item</Menu.Item>
			</Menu.Popover>
		</Menu.Root>

		<Tooltip.Root className="tooltip">
			<Tooltip.Trigger data-testid="tooltip-trigger">Tooltip</Tooltip.Trigger>
			<Tooltip.Content data-testid="tooltip-content">
				Tooltip text
			</Tooltip.Content>
		</Tooltip.Root>
	</>
);
