<script setup lang="ts">
import { Menu } from "@/components/ui"
</script>

<template>
  <div>
    <Menu.Root>
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
        <Menu.Sub data-testid="group">
          <Menu.Trigger data-testid="submenu-trigger">
            Submenu
          </Menu.Trigger>
          <Menu.Popover data-testid="submenu-list">
            <Menu.Item data-testid="submenu-item-1">
              Sub Item 1
            </Menu.Item>
            <Menu.Item>
              Sub Item 2
            </Menu.Item>
            <Menu.Sub data-testid="subgroup">
              <Menu.Trigger data-testid="submenu2-trigger">
                Nested
              </Menu.Trigger>
              <Menu.Popover data-testid="submenu2-list">
                <Menu.Item data-testid="submenu2-item-1">
                  Deep Item 1
                </Menu.Item>
                <Menu.Item>
                  Deep Item 2
                </Menu.Item>
              </Menu.Popover>
            </Menu.Sub>
          </Menu.Popover>
        </Menu.Sub>
      </Menu.Popover>
    </Menu.Root>
  </div>
</template>
