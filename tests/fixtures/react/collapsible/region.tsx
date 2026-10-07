import { Collapsible } from "@/components/ui";

export default () => (
  <>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="region-trigger">Shipping</Collapsible.Trigger>
      <Collapsible.Panel role="region" data-testid="region-content">
        <p>Two to four business days.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="plain-trigger">Returns</Collapsible.Trigger>
      <Collapsible.Panel data-testid="plain-content">
        <p>Thirty days.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
);
