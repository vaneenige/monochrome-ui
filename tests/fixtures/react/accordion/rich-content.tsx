import { Accordion } from "monochrome/react";

export default () => (
	<>
		<Accordion.Root type="multiple">
			<Accordion.Item>
				<Accordion.Header>
					<Accordion.Trigger data-testid="rich-trigger-1">
						Section with Form
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Panel data-testid="rich-content-1">
					<form>
						<label>
							Name: <input type="text" data-testid="rich-input" />
						</label>
						<button type="button" data-testid="rich-button">
							Submit
						</button>
					</form>
				</Accordion.Panel>
			</Accordion.Item>
			<Accordion.Item>
				<Accordion.Header>
					<Accordion.Trigger>Section with List</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Panel>
					<ul>
						<li>Item A</li>
						<li>Item B</li>
						<li>Item C</li>
					</ul>
				</Accordion.Panel>
			</Accordion.Item>
		</Accordion.Root>
	</>
);
