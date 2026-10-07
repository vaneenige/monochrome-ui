import { Collapsible } from "@/components/ui";

export default () => (
  <>
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger data-testid="open-collapsible-trigger">
        Hide information
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="open-collapsible-content">
        <p>This content is visible by default and can be hidden.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
);
