/** @jsxImportSource remix/ui */
import { createRoot, on, type Handle } from "remix/ui";
import { Tabs } from "monochrome/remix";

const click = (handler: () => void) => on<HTMLElement>("click", handler);

function App(handle: Handle) {
  let tabs = [
    { value: "tab1", label: "Tab 1", content: "Content 1" },
    { value: "tab2", label: "Tab 2", content: "Content 2" },
    { value: "tab3", label: "Tab 3", content: "Content 3" },
  ];
  let output = "";
  let orientation: "horizontal" | "vertical" = "horizontal";
  let disableTab2 = false;

  return () => (
    <>
      <div id="output" data-testid="output">
        {output}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="add-tab"
          mix={click(() => {
            tabs = [
              ...tabs,
              {
                value: `tab${tabs.length + 1}`,
                label: `Tab ${tabs.length + 1}`,
                content: `Content ${tabs.length + 1}`,
              },
            ];
            void handle.update();
          })}
        >
          Add Tab
        </button>
        <button
          type="button"
          data-testid="remove-tab"
          mix={click(() => {
            tabs = tabs.slice(0, -1);
            void handle.update();
          })}
        >
          Remove Tab
        </button>
        <button
          type="button"
          data-testid="toggle-orientation"
          mix={click(() => {
            orientation = orientation === "horizontal" ? "vertical" : "horizontal";
            void handle.update();
          })}
        >
          Toggle Orientation
        </button>
        <button
          type="button"
          data-testid="toggle-disabled"
          mix={click(() => {
            disableTab2 = !disableTab2;
            void handle.update();
          })}
        >
          Toggle Disabled Tab 2
        </button>
      </div>
      <Tabs.Root
        defaultValue="tab1"
        orientation={orientation}
        class="tabs-root"
        data-testid="tabs-root"
      >
        <Tabs.List data-testid="tablist">
          {tabs.map((tab, i) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              data-testid={`tab-${i + 1}`}
              disabled={i === 1 && disableTab2}
              mix={click(() => {
                output = `tab-${i + 1}-clicked`;
                void handle.update();
              })}
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

      <Tabs.Root defaultValue="t1">
        <Tabs.List>
          <Tabs.Tab value="t1" data-testid="tabs2-tab-1">
            T1
          </Tabs.Tab>
          <Tabs.Tab value="t2" data-testid="tabs2-tab-2">
            T2
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="t1">
          <p>Panel T1</p>
        </Tabs.Panel>
        <Tabs.Panel value="t2" data-testid="tabs2-panel-2">
          <p>Panel T2</p>
        </Tabs.Panel>
      </Tabs.Root>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
