import {
	createContext,
	createElement,
	type ReactElement,
	useContext,
	useId,
} from "react";
import type { BaseProps } from "./shared.js";

type PopoverContextValue = { id: string };
const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
	const context = useContext(PopoverContext);
	if (!context)
		throw new Error("Popover components must be used within Popover.Root");
	return context;
}

function Root({ children, ...props }: BaseProps): ReactElement {
	const id = useId();
	return createElement(
		PopoverContext.Provider,
		{ value: { id } },
		createElement("div", props, children),
	);
}

function Trigger({ children, ...props }: BaseProps): ReactElement {
	const context = usePopoverContext();
	return createElement(
		"button",
		{
			...props,
			type: "button",
			id: `mct:popover:${context.id}`,
			"aria-controls": `mcc:popover:${context.id}`,
			"aria-expanded": "false",
		},
		children,
	);
}

function Content({ children, ...props }: BaseProps): ReactElement {
	const context = usePopoverContext();
	const hasLabel = "aria-label" in props;
	const hasDescription = "aria-description" in props;
	return createElement(
		"div",
		{
			...(hasLabel ? {} : { "aria-labelledby": `mct:popover:${context.id}` }),
			...(hasDescription
				? {}
				: { "aria-describedby": `mcc:popover-description:${context.id}` }),
			...props,
			id: `mcc:popover:${context.id}`,
			"aria-hidden": "true",
			popover: "manual",
			tabIndex: -1,
		},
		children,
	);
}

function Title({
	children,
	as,
	...props
}: BaseProps & {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}): ReactElement {
	const context = usePopoverContext();
	return createElement(
		as ?? "h2",
		{ ...props, id: `mcc:popover-title:${context.id}` },
		children,
	);
}

function Description({ children, ...props }: BaseProps): ReactElement {
	const context = usePopoverContext();
	return createElement(
		"p",
		{ ...props, id: `mcc:popover-description:${context.id}` },
		children,
	);
}

export const Popover = { Root, Trigger, Content, Title, Description };
