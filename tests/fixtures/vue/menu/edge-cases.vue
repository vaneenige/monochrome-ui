<script setup lang="ts">
import { Menu } from "monochrome/vue"
</script>

<template>
  <div>
    <Menu.Root>
      <Menu.Trigger data-testid="disabled-first-trigger">
        MenuTrigger
      </Menu.Trigger>
      <Menu.Popover data-testid="disabled-first-list">
        <Menu.Item
          data-testid="disabled-first-item-1"
          :disabled="true"
        >
          Item 1
        </Menu.Item>
        <Menu.Item data-testid="disabled-first-item-2">
          Item 2
        </Menu.Item>
        <Menu.Item data-testid="disabled-first-item-3">
          Item 3
        </Menu.Item>
        <Menu.Item
          data-testid="disabled-first-item-4"
          :disabled="true"
        >
          Item 4
        </Menu.Item>
      </Menu.Popover>
    </Menu.Root>
    <Menu.Root>
      <Menu.Trigger data-testid="all-disabled-trigger">
        MenuTrigger
      </Menu.Trigger>
      <Menu.Popover data-testid="all-disabled-list">
        <Menu.Item
         
          :disabled="true"
        >
          Item 1
        </Menu.Item>
        <Menu.Item
         
          :disabled="true"
        >
          Item 2
        </Menu.Item>
        <Menu.Item
         
          :disabled="true"
        >
          Item 3
        </Menu.Item>
        <Menu.Item
         
          :disabled="true"
        >
          Item 4
        </Menu.Item>
      </Menu.Popover>
    </Menu.Root>
    <Menu.Root>
      <Menu.Trigger data-testid="no-items-trigger">
        MenuTrigger
      </Menu.Trigger>
      <Menu.Popover />
    </Menu.Root>
  </div>
</template>
