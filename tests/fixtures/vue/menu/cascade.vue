<script setup lang="ts">
import { Menu } from "@/components/ui"
</script>

<template>
  <Menu.Root>
    <Menu.Trigger data-testid="root-trigger">Cascade</Menu.Trigger>
    <Menu.Popover data-testid="root-list">
      <Menu.Sub>
        <Menu.Trigger data-testid="l1-trigger">Level 1</Menu.Trigger>
        <Menu.Popover data-testid="l1-list">
          <Menu.Sub>
            <Menu.Trigger data-testid="l2-trigger">Level 2</Menu.Trigger>
            <Menu.Popover data-testid="l2-list">
              <Menu.Sub>
                <Menu.Trigger data-testid="l3-trigger">Level 3</Menu.Trigger>
                <Menu.Popover data-testid="l3-list">
                  <Menu.Sub>
                    <Menu.Trigger data-testid="l4-trigger">Level 4</Menu.Trigger>
                    <Menu.Popover data-testid="l4-list">
                      <Menu.Item>Level 4 item</Menu.Item>
                    </Menu.Popover>
                  </Menu.Sub>
                  <Menu.Item>Level 3 item</Menu.Item>
                </Menu.Popover>
              </Menu.Sub>
              <Menu.Item>Level 2 item</Menu.Item>
            </Menu.Popover>
          </Menu.Sub>
          <Menu.Item>Level 1 item</Menu.Item>
        </Menu.Popover>
      </Menu.Sub>
      <Menu.Item>Root item</Menu.Item>
    </Menu.Popover>
  </Menu.Root>
</template>
