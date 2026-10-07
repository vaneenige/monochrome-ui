<script setup lang="ts">
import { Menu } from "@/components/ui"

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)
</script>

<template>
  <div data-testid="page-spacer" style="height: 3000px" />
  <Menu.Root>
    <Menu.Trigger data-testid="root-trigger" style="position: fixed; left: 40vw; top: 40vh">
      Tall menu
    </Menu.Trigger>
    <Menu.Popover data-testid="root-list">
      <Menu.Sub>
        <Menu.Trigger data-testid="root-submenu-trigger">Item 1</Menu.Trigger>
        <Menu.Popover data-testid="root-submenu-list">
          <Menu.Item v-for="i in range(1, 30)" :key="i" :data-testid="`root-submenu-item-${i}`">
            Submenu item {{ i }}
          </Menu.Item>
        </Menu.Popover>
      </Menu.Sub>
      <Menu.Item v-for="i in range(2, 24)" :key="i" :data-testid="`root-item-${i}`">
        {{ i === 18 ? "Zoom" : "Item" }} {{ i }}
      </Menu.Item>
    </Menu.Popover>
  </Menu.Root>
</template>
