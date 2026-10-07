"use client";

import "monochrome/tabs";
import { type ComponentProps, createContext, use, useId } from "react";

type Orientation = "horizontal" | "vertical";

const TabsContext = createContext<{
  id: string;
  selected: string;
  orientation: Orientation;
} | null>(null);

function useRoot() {
  const context = use(TabsContext);
  if (!context) throw new Error("Tabs parts must be used within Tabs.Root");
  return context;
}

const part = (id: string, value: string) => (value ? `${id}:${value}` : id);

function Root({
  defaultValue,
  orientation = "horizontal",
  ...props
}: ComponentProps<"div"> & { defaultValue: string; orientation?: Orientation }) {
  const id = useId();
  return (
    <TabsContext value={{ id, selected: defaultValue, orientation }}>
      <div {...props} data-slot="tabs" id={`mcr:tabs:${id}`} />
    </TabsContext>
  );
}

function List(props: ComponentProps<"div">) {
  const { orientation } = useRoot();
  return <div {...props} data-slot="tabs-list" role="tablist" aria-orientation={orientation} />;
}

function Tab({
  value,
  defaultSelected,
  disabled,
  onClick,
  ...props
}: ComponentProps<"button"> & { value: string; defaultSelected?: boolean }) {
  const { id, selected } = useRoot();
  const tab = part(id, value);
  const isSelected = defaultSelected ?? value === selected;
  return (
    <button
      {...props}
      onClick={disabled ? undefined : onClick}
      data-slot="tabs-tab"
      type="button"
      role="tab"
      id={`mct:tabs:${tab}`}
      aria-selected={isSelected}
      aria-controls={`mcc:tabs:${tab}`}
      tabIndex={isSelected ? 0 : -1}
      aria-disabled={disabled || undefined}
    />
  );
}

function Panel({
  value,
  defaultSelected,
  focusable = true,
  ...props
}: ComponentProps<"div"> & { value: string; defaultSelected?: boolean; focusable?: boolean }) {
  const { id, selected } = useRoot();
  const tab = part(id, value);
  const isSelected = defaultSelected ?? value === selected;
  return (
    <div
      {...props}
      data-slot="tabs-panel"
      role="tabpanel"
      id={`mcc:tabs:${tab}`}
      aria-labelledby={`mct:tabs:${tab}`}
      hidden={isSelected ? undefined : true}
      tabIndex={focusable ? (isSelected ? 0 : -1) : undefined}
    />
  );
}

export const Tabs = { Root, List, Tab, Panel };
