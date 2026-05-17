import { Menu } from "monochrome/react";

export default () => (
	<>
		<Menu.Root>
			<section data-testid="section-a">
				<h2>Bare siblings</h2>
				<Menu.Trigger data-testid="a-trigger">Menu A</Menu.Trigger>
				<Menu.Popover data-testid="a-list">
					<Menu.Item data-testid="a-item-1">A Item 1</Menu.Item>
					<Menu.Item data-testid="a-item-2">A Item 2</Menu.Item>
				</Menu.Popover>
			</section>
		</Menu.Root>

		<Menu.Root>
			<section data-testid="section-b">
				<h2>Separated by unrelated content</h2>
				<Menu.Trigger data-testid="b-trigger">Menu B</Menu.Trigger>
				<p>An unrelated paragraph between trigger and popover.</p>
				<div>
					<span>More chrome that has nothing to do with the menu.</span>
				</div>
				<Menu.Popover data-testid="b-list">
					<Menu.Item data-testid="b-item-1">B Item 1</Menu.Item>
					<Menu.Item data-testid="b-item-2">B Item 2</Menu.Item>
				</Menu.Popover>
			</section>
		</Menu.Root>

		<Menu.Root>
			<header data-testid="header-c">
				<h2>Trigger in a different container from popover</h2>
				<Menu.Trigger data-testid="c-trigger">Menu C</Menu.Trigger>
			</header>
			<main data-testid="main-c">
				<p>Main content lives between Menu C's trigger and its popover.</p>
			</main>
			<aside data-testid="aside-c">
				<Menu.Popover data-testid="c-list">
					<Menu.Item data-testid="c-item-1">C Item 1</Menu.Item>
					<Menu.Group>
						<Menu.Trigger data-testid="c-submenu-trigger">
							C Submenu
						</Menu.Trigger>
						<footer data-testid="footer-c">
							<Menu.Popover data-testid="c-submenu-list">
								<Menu.Item data-testid="c-sub-item-1">C Sub Item 1</Menu.Item>
								<Menu.Item data-testid="c-sub-item-2">C Sub Item 2</Menu.Item>
							</Menu.Popover>
						</footer>
					</Menu.Group>
				</Menu.Popover>
			</aside>
		</Menu.Root>
	</>
);
