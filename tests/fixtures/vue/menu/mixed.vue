<script setup lang="ts">
import { Menu, Menubar } from "monochrome/vue"
</script>

<template>
  <div style="padding: 2rem; display: flex; gap: 300px; align-items: flex-start">
    <Menu.Root>
      <Menu.Trigger data-testid="dropdown-trigger">
        Dropdown
      </Menu.Trigger>
      <Menu.Popover data-testid="dropdown-list">
        <Menu.Item>
          Item 1
        </Menu.Item>
        <Menu.Item>
          Item 2
        </Menu.Item>
      </Menu.Popover>
    </Menu.Root>
    <Menubar.Root>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="menubar-a-trigger-1">
          A1
        </Menubar.Trigger>
        <Menubar.Popover data-testid="menubar-a-list-1">
          <Menubar.Item>
            A1.1
          </Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="menubar-a-trigger-2">
          A2
        </Menubar.Trigger>
        <Menubar.Popover data-testid="menubar-a-list-2">
          <Menubar.Item>
            A2.1
          </Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
    </Menubar.Root>
    <Menubar.Root>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="menubar-b-trigger-1">
          B1
        </Menubar.Trigger>
        <Menubar.Popover data-testid="menubar-b-list-1">
          <Menubar.Item>
            B1.1
          </Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>
          B2
        </Menubar.Trigger>
        <Menubar.Popover>
          <Menubar.Item>
            B2.1
          </Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
    </Menubar.Root>
  </div>
</template>
