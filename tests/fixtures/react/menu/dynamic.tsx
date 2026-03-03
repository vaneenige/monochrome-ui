import { Menu } from "monochrome/react"
import { useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [items, setItems] = useState(["Item 1", "Item 2", "Item 3"])
  const [hasSubmenu, setHasSubmenu] = useState(false)
  const [checked, setChecked] = useState(false)
  const [radio, setRadio] = useState("a")
  const [disableItem2, setDisableItem2] = useState(false)

  return (
    <>
      <style>{`
        [role="menu"] {
          position: fixed;
          inset: auto;
          margin: 0;
          top: var(--bottom);
          left: var(--left);
        }
        [role="menu"] [role="menu"] {
          top: var(--top);
          left: var(--right);
          margin-left: 16px;
        }
      `}</style>
      <div id="output" data-testid="output" />
      <div style={{ marginBottom: "8px" }}>
        <button
          type="button"
          data-testid="add-item"
          onClick={() => setItems((prev) => [...prev, `Item ${prev.length + 1}`])}
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
        <button type="button" data-testid="add-submenu" onClick={() => setHasSubmenu(true)}>
          Add Submenu
        </button>
        <button
          type="button"
          data-testid="toggle-checked"
          onClick={() => setChecked((prev) => !prev)}
        >
          Toggle Checked
        </button>
        <button type="button" data-testid="select-radio-b" onClick={() => setRadio("b")}>
          Select Radio B
        </button>
        <button
          type="button"
          data-testid="toggle-disabled"
          onClick={() => setDisableItem2((prev) => !prev)}
        >
          Toggle Disabled
        </button>
      </div>
      <Menu.Root className="menu-root" data-testid="menu-root">
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
              onClick={() => {
                document.getElementById("output")!.textContent = `item-${i + 1}-clicked`
              }}
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
            onClick={() => setChecked((prev) => !prev)}
          >
            Checkbox
          </Menu.CheckboxItem>
          <Menu.RadioItem
            data-testid="radio-a"
            checked={radio === "a"}
            onClick={() => setRadio("a")}
          >
            Radio A
          </Menu.RadioItem>
          <Menu.RadioItem
            data-testid="radio-b"
            checked={radio === "b"}
            onClick={() => setRadio("b")}
          >
            Radio B
          </Menu.RadioItem>
          {hasSubmenu && (
            <Menu.Group>
              <Menu.Trigger data-testid="submenu-trigger">Submenu</Menu.Trigger>
              <Menu.Popover data-testid="submenu-list">
                <Menu.Item data-testid="submenu-item-1">Sub Item 1</Menu.Item>
                <Menu.Item data-testid="submenu-item-2">Sub Item 2</Menu.Item>
              </Menu.Popover>
            </Menu.Group>
          )}
        </Menu.Popover>
      </Menu.Root>

      <Menu.Root data-testid="menu2-root">
        <Menu.Trigger data-testid="menu2-trigger">Open Menu 2</Menu.Trigger>
        <Menu.Popover data-testid="menu2-list">
          <Menu.Item data-testid="menu2-item-1">Menu2 Item 1</Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
