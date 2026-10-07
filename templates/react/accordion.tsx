"use client";

import "monochrome/accordion";
import { type ComponentProps, createContext, use, useId } from "react";

type ItemContext = { id: string; open: boolean; disabled: boolean };

const AccordionContext = createContext<ItemContext | null>(null);

function useItem() {
  const context = use(AccordionContext);
  if (!context) throw new Error("Accordion parts must be used within Accordion.Item");
  return context;
}

function Root(props: ComponentProps<"div">) {
  const id = useId();
  return <div {...props} data-slot="accordion" id={`mcr:accordion:${id}`} />;
}

function Item({
  defaultOpen = false,
  disabled = false,
  ...props
}: ComponentProps<"div"> & { defaultOpen?: boolean; disabled?: boolean }) {
  const id = useId();
  return (
    <AccordionContext value={{ id, open: defaultOpen, disabled }}>
      <div {...props} data-slot="accordion-item" />
    </AccordionContext>
  );
}

function Header({
  as: Heading = "h3",
  ...props
}: ComponentProps<"h3"> & { as?: "h2" | "h3" | "h4" | "h5" | "h6" }) {
  return <Heading {...props} data-slot="accordion-header" />;
}

function Trigger({ onClick, ...props }: ComponentProps<"button">) {
  const { id, open, disabled } = useItem();
  return (
    <button
      {...props}
      onClick={disabled ? undefined : onClick}
      data-slot="accordion-trigger"
      type="button"
      id={`mct:accordion:${id}`}
      aria-expanded={open}
      aria-controls={`mcc:accordion:${id}`}
      aria-disabled={disabled || undefined}
    />
  );
}

function Panel(props: ComponentProps<"div">) {
  const { id, open } = useItem();
  return (
    <div
      {...props}
      data-slot="accordion-panel"
      role="region"
      id={`mcc:accordion:${id}`}
      aria-labelledby={`mct:accordion:${id}`}
      hidden={open ? undefined : true}
    />
  );
}

export const Accordion = { Root, Item, Header, Trigger, Panel };
