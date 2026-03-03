<script setup lang="ts">
import { Menu } from "monochrome/vue"
</script>

<template>
  <div>
    <div style="display: flex; gap: 200px">
      <Menu.Root class="menu">
        <Menu.Trigger data-testid="menu-a-trigger">
          Menu A
        </Menu.Trigger>
        <Menu.Popover data-testid="menu-a-list">
          <Menu.Item data-testid="menu-a-item-1">
            Item A1
          </Menu.Item>
          <Menu.Item data-testid="menu-a-item-2">
            Item A2
          </Menu.Item>
        </Menu.Popover>
      </Menu.Root>
      <Menu.Root class="menu">
        <Menu.Trigger data-testid="menu-b-trigger">
          Menu B
        </Menu.Trigger>
        <Menu.Popover data-testid="menu-b-list">
          <Menu.Item data-testid="menu-b-item-1">
            Item B1
          </Menu.Item>
          <Menu.Item data-testid="menu-b-item-2">
            Item B2
          </Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </div>
  </div>
</template>
