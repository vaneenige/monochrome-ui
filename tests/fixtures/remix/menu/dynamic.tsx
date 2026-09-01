/** @jsxImportSource remix/ui */
import { createRoot, on, type Handle } from "remix/ui";
import { Menu } from "monochrome/remix";

const click = (handler: () => void) => on<HTMLElement>("click", handler);

function App(handle: Handle) {
  let items = ["Item 1", "Item 2", "Item 3"];
  let hasSubmenu = false;
  let checked = false;
  let radio = "a";
  let disableItem2 = false;

  return () => (
    <>
      <div id="output" data-testid="output" />
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="add-item"
          mix={click(() => {
            items = [...items, `Item ${items.length + 1}`];
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
          data-testid="add-submenu"
          mix={click(() => {
            hasSubmenu = true;
            void handle.update();
          })}
        >
          Add Submenu
        </button>
        <button
          type="button"
          data-testid="toggle-checked"
          mix={click(() => {
            checked = !checked;
            void handle.update();
          })}
        >
          Toggle Checked
        </button>
        <button
          type="button"
          data-testid="select-radio-b"
          mix={click(() => {
            radio = "b";
            void handle.update();
          })}
        >
          Select Radio B
        </button>
        <button
          type="button"
          data-testid="toggle-disabled"
          mix={click(() => {
            disableItem2 = !disableItem2;
            void handle.update();
          })}
        >
          Toggle Disabled
        </button>
      </div>
      <Menu.Root>
        <Menu.Trigger data-testid="trigger" data-action="trigger-clicked">
          Open Menu
        </Menu.Trigger>
        <Menu.Popover data-testid="list">
          {items.map((item, i) => (
            <Menu.Item
              key={item}
              data-testid={`item-${i + 1}`}
              data-action={`item-${i + 1}-clicked`}
              disabled={i === 1 && disableItem2}
              mix={click(() => {
                const output = document.getElementById("output");
                if (output) output.textContent = `item-${i + 1}-clicked`;
              })}
            >
              {item}
            </Menu.Item>
          ))}
          <Menu.Item data-testid="item-href" href="https://example.com">
            Link Item
          </Menu.Item>
          <Menu.Label data-testid="label">Group Label</Menu.Label>
          <Menu.Separator data-testid="separator" />
          <Menu.CheckboxItem
            data-testid="checkbox-item"
            checked={checked}
            mix={click(() => {
              checked = !checked;
              void handle.update();
            })}
          >
            Checkbox
          </Menu.CheckboxItem>
          <Menu.RadioItem
            data-testid="radio-a"
            checked={radio === "a"}
            mix={click(() => {
              radio = "a";
              void handle.update();
            })}
          >
            Radio A
          </Menu.RadioItem>
          <Menu.RadioItem
            data-testid="radio-b"
            checked={radio === "b"}
            mix={click(() => {
              radio = "b";
              void handle.update();
            })}
          >
            Radio B
          </Menu.RadioItem>
          {hasSubmenu ? (
            <Menu.Group>
              <Menu.Trigger data-testid="submenu-trigger">Submenu</Menu.Trigger>
              <Menu.Popover data-testid="submenu-list">
                <Menu.Item data-testid="submenu-item-1">Sub Item 1</Menu.Item>
                <Menu.Item>Sub Item 2</Menu.Item>
              </Menu.Popover>
            </Menu.Group>
          ) : null}
        </Menu.Popover>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger data-testid="menu2-trigger">Open Menu 2</Menu.Trigger>
        <Menu.Popover data-testid="menu2-list">
          <Menu.Item>Menu2 Item 1</Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
