<script setup lang="ts">
import { Menu } from "monochrome/vue"
</script>

<template>
  <div>
    <Menu.Root class="menu">
      <Menu.Trigger data-testid="trigger">
        Menu
      </Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.Item data-testid="item-1">
          Item 1
        </Menu.Item>
        <Menu.Item data-testid="item-2">
          Item 2
        </Menu.Item>
        <Menu.Group data-testid="group">
          <Menu.Trigger data-testid="submenu-trigger">
            Submenu
          </Menu.Trigger>
          <Menu.Popover data-testid="submenu-list">
            <Menu.Item data-testid="submenu-item-1">
              Sub Item 1
            </Menu.Item>
            <Menu.Item data-testid="submenu-item-2">
              Sub Item 2
            </Menu.Item>
          </Menu.Popover>
        </Menu.Group>
      </Menu.Popover>
    </Menu.Root>
  </div>
</template>
