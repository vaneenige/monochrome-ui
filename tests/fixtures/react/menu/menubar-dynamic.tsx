import { Menubar } from "monochrome/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

// Holds its own state so a bump re-renders ONLY this subtree: the
// Menubar.Root above it must not re-render, which is exactly the
// partial-re-render scenario the first-claim regression test needs.
function FileMenu() {
	const [n, setN] = useState(0);
	window.__bumpFirstMenu = () => setN((v) => v + 1);
	return (
		<Menubar.Menu>
			<Menubar.Trigger data-testid="trigger-1">File v{n}</Menubar.Trigger>
			<Menubar.Popover data-testid="list-1">
				<Menubar.Item data-testid="item-1-1">New</Menubar.Item>
			</Menubar.Popover>
		</Menubar.Menu>
	);
}

function App() {
	return (
		<Menubar.Root data-testid="menubar">
			<FileMenu />
			<Menubar.Menu>
				<Menubar.Trigger data-testid="trigger-2">Edit</Menubar.Trigger>
				<Menubar.Popover data-testid="list-2">
					<Menubar.Item>Undo</Menubar.Item>
				</Menubar.Popover>
			</Menubar.Menu>
		</Menubar.Root>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
