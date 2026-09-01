/** @jsxImportSource remix/ui */
import { createRoot, on, type Handle } from "remix/ui";
import { Accordion } from "monochrome/remix";

const click = (handler: () => void) => on<HTMLElement>("click", handler);

function App(handle: Handle) {
  let items = [
    { label: "Section 1", content: "Content 1" },
    { label: "Section 2", content: "Content 2" },
    { label: "Section 3", content: "Content 3" },
  ];
  let disabledIndex: number | null = null;
  let output = "";
  let mode: "single" | "multiple" = "single";

  return () => (
    <>
      <div id="output" data-testid="output">
        {output}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="add-item"
          mix={click(() => {
            items = [
              ...items,
              {
                label: `Section ${items.length + 1}`,
                content: `Content ${items.length + 1}`,
              },
            ];
            void handle.update();
          })}
        >
          Add Item
        </button>
        <button
          type="button"
          data-testid="remove-item"
          mix={click(() => {
            items = items.slice(0, -1);
            void handle.update();
          })}
        >
          Remove Item
        </button>
        <button
          type="button"
          data-testid="toggle-disabled"
          mix={click(() => {
            disabledIndex = disabledIndex === 1 ? null : 1;
            void handle.update();
          })}
        >
          Toggle Disabled Item 2
        </button>
        <button
          type="button"
          data-testid="toggle-mode"
          mix={click(() => {
            mode = mode === "single" ? "multiple" : "single";
            void handle.update();
          })}
        >
          Toggle Mode
        </button>
      </div>
      <Accordion.Root type={mode} class="accordion-root" data-testid="accordion-root">
        {items.map((item, i) => (
          <Accordion.Item
            key={item.label}
            data-testid={`item-${i + 1}`}
            disabled={disabledIndex === i}
          >
            <Accordion.Header>
              <Accordion.Trigger
                data-testid={`trigger-${i + 1}`}
                mix={click(() => {
                  output = `trigger-${i + 1}-clicked`;
                  void handle.update();
                })}
              >
                {item.label}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel data-testid={`content-${i + 1}`}>
              <p>{item.content}</p>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <Accordion.Root type="single">
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger data-testid="accordion2-trigger-1">A2 Section 1</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-testid="accordion2-content-1">
            <p>A2 Content 1</p>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger data-testid="accordion2-trigger-2">A2 Section 2</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-testid="accordion2-content-2">
            <p>A2 Content 2</p>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
