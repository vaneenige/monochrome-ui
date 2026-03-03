import { Collapsible } from "monochrome/react"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [mounted, setMounted] = useState(true)
  const [startOpen, setStartOpen] = useState(false)
  const [output, setOutput] = useState("")

  return (
    <>
      <div id="output" data-testid="output">
        {output}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="toggle-mount"
          onClick={() => setMounted((prev) => !prev)}
        >
          {mounted ? "Unmount" : "Mount"}
        </button>
        <button
          type="button"
          data-testid="toggle-open"
          onClick={() => {
            setMounted(false)
            setStartOpen((prev) => !prev)
            setTimeout(() => setMounted(true), 0)
          }}
        >
          Toggle Open Prop
        </button>
      </div>
      {mounted && (
        <Collapsible.Root
          open={startOpen}
          className="collapsible-root"
          data-testid="collapsible-root"
        >
          <Collapsible.Trigger data-testid="trigger" onClick={() => setOutput("trigger-clicked")}>
            Toggle Content
          </Collapsible.Trigger>
          <Collapsible.Panel data-testid="content">
            <p>Collapsible content here</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}

      <Collapsible.Root data-testid="collapsible2-root">
        <Collapsible.Trigger data-testid="collapsible2-trigger">
          Toggle Content 2
        </Collapsible.Trigger>
        <Collapsible.Panel data-testid="collapsible2-content">
          <p>Second collapsible content</p>
        </Collapsible.Panel>
      </Collapsible.Root>
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
