/** @jsxImportSource remix/ui */
import { Tooltip } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <Tooltip.Root>
      <header>
        <Tooltip.Trigger data-testid="trigger">Hover</Tooltip.Trigger>
      </header>
      <main data-testid="main">
        <p>Unrelated chrome between the trigger and its tooltip.</p>
      </main>
      <aside>
        <Tooltip.Content data-testid="content">Help text</Tooltip.Content>
      </aside>
    </Tooltip.Root>
  );
}
