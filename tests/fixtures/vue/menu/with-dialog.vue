<script setup lang="ts">
import { Dialog, Menu } from "monochrome/vue"
</script>

<template>
  <Dialog.Root>
    <Menu.Root>
      <Menu.Trigger data-testid="menu-trigger">
        Menu
      </Menu.Trigger>
      <Menu.Popover data-testid="menu-list">
        <Menu.Item data-testid="menu-item-1">
          Item 1
        </Menu.Item>
        <li role="none">
          <Dialog.Trigger data-testid="dialog-item" role="menuitem" tabindex="-1">
            Delete
          </Dialog.Trigger>
        </li>
      </Menu.Popover>
    </Menu.Root>
    <Dialog.Content data-testid="dialog-content">
      <Dialog.Title>Confirm action</Dialog.Title>
      <Dialog.Description>This cannot be undone.</Dialog.Description>
      <Dialog.Close data-testid="dialog-close">Cancel</Dialog.Close>
    </Dialog.Content>
  </Dialog.Root>
</template>
