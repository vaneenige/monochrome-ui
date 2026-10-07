import { Popover } from "@/components/ui/popover";

export function SharePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger>Share</Popover.Trigger>
      <Popover.Content>
        <Popover.Description>Anyone with the link can view this file.</Popover.Description>
        <input type="text" defaultValue="https://example.com/f/42" aria-label="Link" readOnly />
        <button type="button">Copy link</button>
      </Popover.Content>
    </Popover.Root>
  );
}
