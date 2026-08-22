import { createRoot } from "react-dom/client";
import { Collapsible } from "monochrome/react";

function App() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        data-testid="collapsible-trigger"
        ref={(el) => {
          if (el) el.dataset.refAttached = "true";
        }}
      >
        Toggle
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="collapsible-content">Hidden</Collapsible.Panel>
    </Collapsible.Root>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
