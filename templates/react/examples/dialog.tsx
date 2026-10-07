import { Dialog } from "@/components/ui/dialog";

export function ConfirmDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Delete file</Dialog.Trigger>
      <Dialog.Content initialFocus="close">
        <Dialog.Title>Delete this file?</Dialog.Title>
        <Dialog.Description>This cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
        <Dialog.Action>Delete</Dialog.Action>
      </Dialog.Content>
    </Dialog.Root>
  );
}
