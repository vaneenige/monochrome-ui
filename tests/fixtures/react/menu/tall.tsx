import { Menu } from "@/components/ui";

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

export default () => (
  <>
    <div data-testid="page-spacer" style={{ height: 3000 }} />
    <Menu.Root>
      <Menu.Trigger
        data-testid="root-trigger"
        style={{ position: "fixed", left: "40vw", top: "40vh" }}
      >
        Tall menu
      </Menu.Trigger>
      <Menu.Popover data-testid="root-list">
        <Menu.Sub>
          <Menu.Trigger data-testid="root-submenu-trigger">Item 1</Menu.Trigger>
          <Menu.Popover data-testid="root-submenu-list">
            {range(1, 30).map((i) => (
              <Menu.Item key={i} data-testid={`root-submenu-item-${i}`}>
                Submenu item {i}
              </Menu.Item>
            ))}
          </Menu.Popover>
        </Menu.Sub>
        {range(2, 24).map((i) => (
          <Menu.Item key={i} data-testid={`root-item-${i}`}>
            {i === 18 ? "Zoom" : "Item"} {i}
          </Menu.Item>
        ))}
      </Menu.Popover>
    </Menu.Root>
  </>
);
