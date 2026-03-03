<script setup lang="ts">
import { Collapsible, Menu } from "monochrome/vue"
</script>

<template>
  <div>
    <div
      data-testid="sidebar"
      style="width: 250px; height: 400px; overflow: auto"
    >
      <Collapsible.Root :open="true">
        <Collapsible.Trigger data-testid="collapsible-trigger">
          Section
        </Collapsible.Trigger>
        <Collapsible.Panel data-testid="collapsible-panel">
          <Menu.Root class="menu">
            <Menu.Trigger data-testid="nested-menu-trigger">
              Nested Menu
            </Menu.Trigger>
            <Menu.Popover data-testid="nested-menu-list">
              <Menu.Item data-testid="nested-menu-item-1">
                Item 1
              </Menu.Item>
              <Menu.Item data-testid="nested-menu-item-2">
                Item 2
              </Menu.Item>
              <Menu.Item data-testid="nested-menu-item-3">
                Item 3
              </Menu.Item>
            </Menu.Popover>
          </Menu.Root>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  </div>
</template>
