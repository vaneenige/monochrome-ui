/** @jsxImportSource remix/ui */
import { Dialog } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <Dialog.Root>
      <header>
        <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
      </header>
      <main data-testid="main">
        <p>Unrelated chrome between the trigger and its dialog.</p>
      </main>
      <aside>
        <Dialog.Content data-testid="content">
          <Dialog.Title>Confirm</Dialog.Title>
          <Dialog.Close data-testid="close">Close</Dialog.Close>
        </Dialog.Content>
      </aside>
    </Dialog.Root>
  );
}
