/** @jsxImportSource remix/ui */
import { createRoot, on, type Handle } from "remix/ui";
import { Collapsible } from "monochrome/remix";

const click = (handler: () => void) => on<HTMLElement>("click", handler);

function App(handle: Handle) {
  let mounted = true;
  let startOpen = false;
  let output = "";

  return () => (
    <>
      <div id="output" data-testid="output">
        {output}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="toggle-mount"
          mix={click(() => {
            mounted = !mounted;
            void handle.update();
          })}
        >
          {mounted ? "Unmount" : "Mount"}
        </button>
        <button
          type="button"
          data-testid="toggle-open"
          mix={click(() => {
            mounted = false;
            startOpen = !startOpen;
            void handle.update().then(() => {
              mounted = true;
              void handle.update();
            });
          })}
        >
          Toggle Open Prop
        </button>
      </div>
      {mounted ? (
        <Collapsible.Root open={startOpen} class="collapsible-root" data-testid="collapsible-root">
          <Collapsible.Trigger
            data-testid="trigger"
            mix={click(() => {
              output = "trigger-clicked";
              void handle.update();
            })}
          >
            Toggle Content
          </Collapsible.Trigger>
          <Collapsible.Panel data-testid="content">
            <p>Collapsible content here</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      ) : null}

      <Collapsible.Root>
        <Collapsible.Trigger data-testid="collapsible2-trigger">
          Toggle Content 2
        </Collapsible.Trigger>
        <Collapsible.Panel data-testid="collapsible2-content">
          <p>Second collapsible content</p>
        </Collapsible.Panel>
      </Collapsible.Root>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
