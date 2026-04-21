import { Menu } from "monochrome/react";

export default () => (
	<>
		<style>{`
      [role="menubar"] {
        display: flex;
        flex-direction: row;
        gap: 100px;
      }
    `}</style>
		<div
			style={{
				padding: "2rem",
				display: "flex",
				gap: "300px",
				alignItems: "flex-start",
			}}
		>
			<Menu.Root className="menu">
				<Menu.Trigger data-testid="dropdown-trigger">Dropdown</Menu.Trigger>
				<Menu.Popover data-testid="dropdown-list">
					<Menu.Item data-testid="dropdown-item-1">Item 1</Menu.Item>
					<Menu.Item data-testid="dropdown-item-2">Item 2</Menu.Item>
				</Menu.Popover>
			</Menu.Root>
			<Menu.Root className="menu" menubar>
				<Menu.Popover data-testid="menubar-a-list">
					<Menu.Group>
						<Menu.Trigger data-testid="menubar-a-trigger-1">A1</Menu.Trigger>
						<Menu.Popover data-testid="menubar-a-list-1">
							<Menu.Item data-testid="menubar-a-item-1-1">A1.1</Menu.Item>
						</Menu.Popover>
					</Menu.Group>
					<Menu.Group>
						<Menu.Trigger data-testid="menubar-a-trigger-2">A2</Menu.Trigger>
						<Menu.Popover data-testid="menubar-a-list-2">
							<Menu.Item data-testid="menubar-a-item-2-1">A2.1</Menu.Item>
						</Menu.Popover>
					</Menu.Group>
				</Menu.Popover>
			</Menu.Root>
			<Menu.Root className="menu" menubar>
				<Menu.Popover data-testid="menubar-b-list">
					<Menu.Group>
						<Menu.Trigger data-testid="menubar-b-trigger-1">B1</Menu.Trigger>
						<Menu.Popover data-testid="menubar-b-list-1">
							<Menu.Item data-testid="menubar-b-item-1-1">B1.1</Menu.Item>
						</Menu.Popover>
					</Menu.Group>
					<Menu.Group>
						<Menu.Trigger data-testid="menubar-b-trigger-2">B2</Menu.Trigger>
						<Menu.Popover data-testid="menubar-b-list-2">
							<Menu.Item data-testid="menubar-b-item-2-1">B2.1</Menu.Item>
						</Menu.Popover>
					</Menu.Group>
				</Menu.Popover>
			</Menu.Root>
		</div>
	</>
);
