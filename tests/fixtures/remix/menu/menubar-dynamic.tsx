/** @jsxImportSource remix/ui */
import { createRoot, on, type Handle } from "remix/ui";
import { Menubar } from "monochrome/remix";

function FileMenu(handle: Handle) {
  let n = 0;
  window.__bumpFirstMenu = () => {
    n++;
    void handle.update();
  };
  return () => (
    <Menubar.Menu>
      <Menubar.Trigger data-testid="trigger-1">File v{n}</Menubar.Trigger>
      <Menubar.Popover data-testid="list-1">
        <Menubar.Item data-testid="item-1-1">New</Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
  );
}

function App(handle: Handle) {
  let showFirst = true;
  let extra = false;
  return () => (
    <>
      <div>
        <button
          type="button"
          data-testid="remove-first"
          mix={on("click", () => {
            showFirst = false;
            void handle.update();
          })}
        >
          Remove first
        </button>
        <button
          type="button"
          data-testid="add-extra"
          mix={on("click", () => {
            extra = true;
            void handle.update();
          })}
        >
          Add extra
        </button>
      </div>
      <Menubar.Root data-testid="menubar">
        {showFirst ? <FileMenu /> : null}
        <Menubar.Menu>
          <Menubar.Trigger data-testid="trigger-2">Edit</Menubar.Trigger>
          <Menubar.Popover data-testid="list-2">
            <Menubar.Item>Undo</Menubar.Item>
          </Menubar.Popover>
        </Menubar.Menu>
        {extra ? (
          <Menubar.Menu>
            <Menubar.Trigger data-testid="trigger-3">View</Menubar.Trigger>
            <Menubar.Popover data-testid="list-3">
              <Menubar.Item>Zoom</Menubar.Item>
            </Menubar.Popover>
          </Menubar.Menu>
        ) : null}
      </Menubar.Root>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
