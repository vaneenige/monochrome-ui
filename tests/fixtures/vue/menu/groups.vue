<script setup lang="ts">
import { Menu } from "@/components/ui"
</script>

<template>
  <button type="button" data-testid="focus-before">Focus before</button>
  <Menu.Root>
    <Menu.Trigger data-testid="trigger">Format</Menu.Trigger>
    <Menu.Popover data-testid="list">
      <Menu.Group data-testid="group-a" label="Size">
        <Menu.RadioItem data-testid="radio-a1" default-checked>Small</Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-a2">Medium</Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-a3" disabled>Huge</Menu.RadioItem>
      </Menu.Group>
      <Menu.Item data-testid="item-cut">Cut</Menu.Item>
      <Menu.RadioItem data-testid="radio-c1" default-checked>Loose</Menu.RadioItem>
      <Menu.RadioItem data-testid="radio-c2">Tight</Menu.RadioItem>
      <Menu.Group data-testid="group-b" aria-label="Color">
        <Menu.RadioItem data-testid="radio-b1" default-checked>Red</Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-b2">Blue</Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-b3" hidden>Violet</Menu.RadioItem>
      </Menu.Group>
    </Menu.Popover>
  </Menu.Root>
  <button type="button" data-testid="focus-after">Focus after</button>
</template>
