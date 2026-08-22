import { Collapsible } from "monochrome/react";

export default () => (
  <Collapsible.Root disabled>
    <Collapsible.Trigger data-testid="collapsible-trigger">
      Show more information
    </Collapsible.Trigger>
    <Collapsible.Panel data-testid="collapsible-content">
      <p>This content stays hidden while the trigger is disabled.</p>
    </Collapsible.Panel>
  </Collapsible.Root>
);
