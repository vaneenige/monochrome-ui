import { Menu } from "monochrome/react";

export default () => (
	<Menu.Root>
		<Menu.Trigger data-testid="typeahead-trigger">MenuTrigger</Menu.Trigger>
		<Menu.Popover>
			<Menu.Item data-testid="typeahead-item-1">Apple</Menu.Item>
			<Menu.Item data-testid="typeahead-item-2">Banana</Menu.Item>
			<Menu.Item data-testid="typeahead-item-3">Avocado</Menu.Item>
			<Menu.Item disabled>Apricot</Menu.Item>
			<Menu.Item data-testid="typeahead-item-5">Artichoke</Menu.Item>
		</Menu.Popover>
	</Menu.Root>
);
