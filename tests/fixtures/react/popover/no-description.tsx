import { Popover } from "@/components/ui";

export default () => (
  <>
    <Popover.Root>
      <Popover.Trigger data-testid="plain-trigger">Share</Popover.Trigger>
      <Popover.Content aria-describedby={undefined} data-testid="plain-content">
        <button type="button">Copy link</button>
      </Popover.Content>
    </Popover.Root>
    <Popover.Root>
      <Popover.Trigger data-testid="described-trigger">Filter</Popover.Trigger>
      <Popover.Content data-testid="described-content">
        <Popover.Description data-testid="described-desc">Narrow the list.</Popover.Description>
      </Popover.Content>
    </Popover.Root>
  </>
);
