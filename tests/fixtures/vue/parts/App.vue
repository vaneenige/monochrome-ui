<script setup lang="ts">
import { Accordion, Collapsible, Dialog, Menu, Menubar, Popover, Tabs } from "@/components/ui"

const log = (id: string) => () => {
  document.getElementById("output")!.textContent += `${id};`
}
</script>

<template>
  <div id="output" data-testid="output" />

  <Menu.Root>
    <Menu.Trigger data-testid="menu-trigger" @click="log('menu-trigger')()">Menu</Menu.Trigger>
    <Menu.Popover data-testid="menu-list">
      <Menu.Item data-testid="menu-item" disabled @click="log('menu-item')()">Disabled</Menu.Item>
      <Menu.Item data-testid="menu-link" disabled href="#nav" @click="log('menu-link')()">
        Disabled link
      </Menu.Item>
      <Menu.CheckboxItem data-testid="menu-checkbox" disabled @click="log('menu-checkbox')()">
        Disabled checkbox
      </Menu.CheckboxItem>
      <Menu.RadioItem data-testid="menu-radio" disabled @click="log('menu-radio')()">
        Disabled radio
      </Menu.RadioItem>
      <Menu.Sub>
        <Menu.Trigger data-testid="menu-sub-trigger" disabled @click="log('menu-sub-trigger')()">
          Disabled submenu
        </Menu.Trigger>
        <Menu.Popover>
          <Menu.Item>Sub item</Menu.Item>
        </Menu.Popover>
      </Menu.Sub>
      <Menu.Item data-testid="menu-enabled" keep-open @click="log('menu-enabled')()">
        Enabled
      </Menu.Item>
    </Menu.Popover>
  </Menu.Root>

  <Menu.Root>
    <Menu.Trigger data-testid="menu-trigger-off" disabled @click="log('menu-trigger-off')()">
      Disabled menu
    </Menu.Trigger>
    <Menu.Popover>
      <Menu.Item>Item</Menu.Item>
    </Menu.Popover>
  </Menu.Root>

  <Menubar.Root>
    <Menubar.Item data-testid="menubar-item" disabled @click="log('menubar-item')()">
      Disabled bar item
    </Menubar.Item>
    <Menubar.Menu>
      <Menubar.Trigger data-testid="menubar-trigger" disabled @click="log('menubar-trigger')()">
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
        <Accordion.Trigger data-testid="accordion-trigger" @click="log('accordion-trigger')()">
          Disabled section
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>Content</Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item>
      <Accordion.Header>
        <Accordion.Trigger data-testid="accordion-enabled" @click="log('accordion-enabled')()">
          Section
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>Content</Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>

  <Collapsible.Root disabled>
    <Collapsible.Trigger data-testid="collapsible-trigger" @click="log('collapsible-trigger')()">
      Disabled details
    </Collapsible.Trigger>
    <Collapsible.Panel>Content</Collapsible.Panel>
  </Collapsible.Root>

  <Dialog.Root>
    <Dialog.Trigger data-testid="dialog-trigger" disabled @click="log('dialog-trigger')()">
      Disabled dialog
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Title>Dialog</Dialog.Title>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Root>

  <Popover.Root>
    <Popover.Trigger data-testid="popover-trigger" disabled @click="log('popover-trigger')()">
      Disabled popover
    </Popover.Trigger>
    <Popover.Content>
      <Popover.Title>Popover</Popover.Title>
    </Popover.Content>
  </Popover.Root>

  <Tabs.Root default-value="one">
    <Tabs.List aria-label="Tabs">
      <Tabs.Tab value="one" data-testid="tab-enabled" @click="log('tab-enabled')()">One</Tabs.Tab>
      <Tabs.Tab value="two" data-testid="tab" disabled @click="log('tab')()">Two</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="one">One</Tabs.Panel>
    <Tabs.Panel value="two">Two</Tabs.Panel>
  </Tabs.Root>
</template>
