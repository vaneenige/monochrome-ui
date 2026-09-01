/** @jsxImportSource remix/ui */
import { Accordion } from "monochrome/remix";

export default function Fixture() {
  return () => (
    <>
      <Accordion.Root type="single">
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>Closed Section</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <p>This section is closed by default.</p>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item open>
          <Accordion.Header>
            <Accordion.Trigger data-testid="default-trigger-2">
              Open Section (default)
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-testid="default-content-2">
            <p>This section is open by default.</p>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>Another Closed Section</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <p>This section is also closed by default.</p>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </>
  );
}
