import { Menu, Menubar } from "monochrome/react";

export default () => (
	<>
		<div
			style={{
				padding: "2rem",
				display: "flex",
				gap: "300px",
				alignItems: "flex-start",
			}}
		>
			<Menu.Root>
				<Menu.Trigger data-testid="dropdown-trigger">Dropdown</Menu.Trigger>
				<Menu.Popover data-testid="dropdown-list">
					<Menu.Item data-testid="dropdown-item-1">Item 1</Menu.Item>
					<Menu.Item data-testid="dropdown-item-2">Item 2</Menu.Item>
				</Menu.Popover>
			</Menu.Root>
			<Menubar.Root data-testid="menubar-a-list">
				<Menubar.Menu>
					<Menubar.Trigger data-testid="menubar-a-trigger-1">
						A1
					</Menubar.Trigger>
					<Menubar.Popover data-testid="menubar-a-list-1">
						<Menubar.Item data-testid="menubar-a-item-1-1">A1.1</Menubar.Item>
					</Menubar.Popover>
				</Menubar.Menu>
				<Menubar.Menu>
					<Menubar.Trigger data-testid="menubar-a-trigger-2">
						A2
					</Menubar.Trigger>
					<Menubar.Popover data-testid="menubar-a-list-2">
						<Menubar.Item data-testid="menubar-a-item-2-1">A2.1</Menubar.Item>
					</Menubar.Popover>
				</Menubar.Menu>
			</Menubar.Root>
			<Menubar.Root data-testid="menubar-b-list">
				<Menubar.Menu>
					<Menubar.Trigger data-testid="menubar-b-trigger-1">
						B1
					</Menubar.Trigger>
					<Menubar.Popover data-testid="menubar-b-list-1">
						<Menubar.Item data-testid="menubar-b-item-1-1">B1.1</Menubar.Item>
					</Menubar.Popover>
				</Menubar.Menu>
				<Menubar.Menu>
					<Menubar.Trigger data-testid="menubar-b-trigger-2">
						B2
					</Menubar.Trigger>
					<Menubar.Popover data-testid="menubar-b-list-2">
						<Menubar.Item data-testid="menubar-b-item-2-1">B2.1</Menubar.Item>
					</Menubar.Popover>
				</Menubar.Menu>
			</Menubar.Root>
		</div>
	</>
);
