import { Accordion } from "monochrome/react"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [items, setItems] = useState([
    { label: "Section 1", content: "Content 1" },
    { label: "Section 2", content: "Content 2" },
    { label: "Section 3", content: "Content 3" },
  ])
  const [disabledIndex, setDisabledIndex] = useState<number | null>(null)
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"single" | "multiple">("single")

  return (
    <>
      <div id="output" data-testid="output">
        {output}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="add-item"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              {
                label: `Section ${prev.length + 1}`,
                content: `Content ${prev.length + 1}`,
              },
            ])
          }
        >
          Add Item
        </button>
        <button
          type="button"
          data-testid="remove-item"
          onClick={() => setItems((prev) => prev.slice(0, -1))}
        >
          Remove Item
        </button>
        <button
          type="button"
          data-testid="toggle-disabled"
          onClick={() => setDisabledIndex((prev) => (prev === 1 ? null : 1))}
        >
          Toggle Disabled Item 2
        </button>
        <button
          type="button"
          data-testid="toggle-mode"
          onClick={() => setMode((prev) => (prev === "single" ? "multiple" : "single"))}
        >
          Toggle Mode
        </button>
      </div>
      <Accordion.Root type={mode} className="accordion-root" data-testid="accordion-root">
        {items.map((item, i) => (
          <Accordion.Item
            key={item.label}
            data-testid={`item-${i + 1}`}
            disabled={disabledIndex === i}
          >
            <Accordion.Header>
              <Accordion.Trigger
                data-testid={`trigger-${i + 1}`}
                onClick={() => setOutput(`trigger-${i + 1}-clicked`)}
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

      <Accordion.Root type="single" data-testid="accordion2-root">
        <Accordion.Item data-testid="accordion2-item-1">
          <Accordion.Header>
            <Accordion.Trigger data-testid="accordion2-trigger-1">A2 Section 1</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-testid="accordion2-content-1">
            <p>A2 Content 1</p>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item data-testid="accordion2-item-2">
          <Accordion.Header>
            <Accordion.Trigger data-testid="accordion2-trigger-2">A2 Section 2</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-testid="accordion2-content-2">
            <p>A2 Content 2</p>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
