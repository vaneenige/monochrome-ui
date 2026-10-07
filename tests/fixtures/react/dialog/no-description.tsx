import { Dialog } from "@/components/ui";

export default () => (
  <>
    <Dialog.Root>
      <Dialog.Trigger data-testid="plain-trigger">Open</Dialog.Trigger>
      <Dialog.Content aria-describedby={undefined} data-testid="plain-content">
        <Dialog.Title>Rename</Dialog.Title>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
    <Dialog.Root>
      <Dialog.Trigger data-testid="described-trigger">Open</Dialog.Trigger>
      <Dialog.Content data-testid="described-content">
        <Dialog.Title>Delete</Dialog.Title>
        <Dialog.Description data-testid="described-desc">This cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  </>
);
