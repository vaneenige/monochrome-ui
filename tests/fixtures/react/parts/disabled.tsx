import { Accordion, Collapsible, Dialog, Menu, Menubar, Popover, Tabs } from "@/components/ui";
import { createRoot } from "react-dom/client";

const log = (id: string) => () => {
  document.getElementById("output")!.textContent += `${id};`;
};

function App() {
  return (
    <>
      <div id="output" data-testid="output" />

      <Menu.Root>
        <Menu.Trigger data-testid="menu-trigger" onClick={log("menu-trigger")}>
          Menu
        </Menu.Trigger>
        <Menu.Popover data-testid="menu-list">
          <Menu.Item data-testid="menu-item" disabled onClick={log("menu-item")}>
            Disabled
          </Menu.Item>
          <Menu.Item data-testid="menu-link" disabled href="#nav" onClick={log("menu-link")}>
            Disabled link
          </Menu.Item>
          <Menu.CheckboxItem data-testid="menu-checkbox" disabled onClick={log("menu-checkbox")}>
            Disabled checkbox
          </Menu.CheckboxItem>
          <Menu.RadioItem data-testid="menu-radio" disabled onClick={log("menu-radio")}>
            Disabled radio
          </Menu.RadioItem>
          <Menu.Sub>
            <Menu.Trigger data-testid="menu-sub-trigger" disabled onClick={log("menu-sub-trigger")}>
              Disabled submenu
            </Menu.Trigger>
            <Menu.Popover>
              <Menu.Item>Sub item</Menu.Item>
            </Menu.Popover>
          </Menu.Sub>
          <Menu.Item data-testid="menu-enabled" keepOpen onClick={log("menu-enabled")}>
            Enabled
          </Menu.Item>
        </Menu.Popover>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger data-testid="menu-trigger-off" disabled onClick={log("menu-trigger-off")}>
          Disabled menu
        </Menu.Trigger>
        <Menu.Popover>
          <Menu.Item>Item</Menu.Item>
        </Menu.Popover>
      </Menu.Root>

      <Menubar.Root>
        <Menubar.Item data-testid="menubar-item" disabled onClick={log("menubar-item")}>
          Disabled bar item
        </Menubar.Item>
        <Menubar.Menu>
          <Menubar.Trigger data-testid="menubar-trigger" disabled onClick={log("menubar-trigger")}>
            Disabled bar menu
          </Menubar.Trigger>
          <Menubar.Popover>
            <Menubar.Item>Item</Menubar.Item>
          </Menubar.Popover>
        </Menubar.Menu>
      </Menubar.Root>

      <Accordion.Root>
        <Accordion.Item disabled>
          <Accordion.Header>
            <Accordion.Trigger data-testid="accordion-trigger" onClick={log("accordion-trigger")}>
              Disabled section
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger data-testid="accordion-enabled" onClick={log("accordion-enabled")}>
              Section
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>

      <Collapsible.Root disabled>
        <Collapsible.Trigger data-testid="collapsible-trigger" onClick={log("collapsible-trigger")}>
          Disabled details
        </Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>

      <Dialog.Root>
        <Dialog.Trigger data-testid="dialog-trigger" disabled onClick={log("dialog-trigger")}>
          Disabled dialog
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Dialog</Dialog.Title>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>

      <Popover.Root>
        <Popover.Trigger data-testid="popover-trigger" disabled onClick={log("popover-trigger")}>
          Disabled popover
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Popover</Popover.Title>
        </Popover.Content>
      </Popover.Root>

      <Tabs.Root defaultValue="one">
        <Tabs.List aria-label="Tabs">
          <Tabs.Tab value="one" data-testid="tab-enabled" onClick={log("tab-enabled")}>
            One
          </Tabs.Tab>
          <Tabs.Tab value="two" data-testid="tab" disabled onClick={log("tab")}>
            Two
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">One</Tabs.Panel>
        <Tabs.Panel value="two">Two</Tabs.Panel>
      </Tabs.Root>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
