import { Tabs } from "monochrome/react"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [tabs, setTabs] = useState([
    { value: "tab1", label: "Tab 1", content: "Content 1" },
    { value: "tab2", label: "Tab 2", content: "Content 2" },
    { value: "tab3", label: "Tab 3", content: "Content 3" },
  ])
  const [output, setOutput] = useState("")
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal")
  const [disableTab2, setDisableTab2] = useState(false)

  return (
    <>
      <div id="output" data-testid="output">
        {output}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="add-tab"
          onClick={() =>
            setTabs((prev) => [
              ...prev,
              {
                value: `tab${prev.length + 1}`,
                label: `Tab ${prev.length + 1}`,
                content: `Content ${prev.length + 1}`,
              },
            ])
          }
        >
          Add Tab
        </button>
        <button
          type="button"
          data-testid="remove-tab"
          onClick={() => setTabs((prev) => prev.slice(0, -1))}
        >
          Remove Tab
        </button>
        <button
          type="button"
          data-testid="toggle-orientation"
          onClick={() =>
            setOrientation((prev) => (prev === "horizontal" ? "vertical" : "horizontal"))
          }
        >
          Toggle Orientation
        </button>
        <button
          type="button"
          data-testid="toggle-disabled"
          onClick={() => setDisableTab2((prev) => !prev)}
        >
          Toggle Disabled Tab 2
        </button>
      </div>
      <Tabs.Root
        defaultValue="tab1"
        orientation={orientation}
        className="tabs-root"
        data-testid="tabs-root"
      >
        <Tabs.List data-testid="tablist">
          {tabs.map((tab, i) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              data-testid={`tab-${i + 1}`}
              disabled={i === 1 && disableTab2}
              onClick={() => setOutput(`tab-${i + 1}-clicked`)}
            >
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tabs.map((tab, i) => (
          <Tabs.Panel key={tab.value} value={tab.value} data-testid={`panel-${i + 1}`}>
            <p>{tab.content}</p>
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      <Tabs.Root defaultValue="t1" data-testid="tabs2-root">
        <Tabs.List data-testid="tabs2-tablist">
          <Tabs.Tab value="t1" data-testid="tabs2-tab-1">
            T1
          </Tabs.Tab>
          <Tabs.Tab value="t2" data-testid="tabs2-tab-2">
            T2
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="t1" data-testid="tabs2-panel-1">
          <p>Panel T1</p>
        </Tabs.Panel>
        <Tabs.Panel value="t2" data-testid="tabs2-panel-2">
          <p>Panel T2</p>
        </Tabs.Panel>
      </Tabs.Root>
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
