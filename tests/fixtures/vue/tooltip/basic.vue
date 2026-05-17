<script setup lang="ts">
import { Menu, Popover, Tooltip } from "monochrome/vue"
</script>

<template>
  <div>
    <div
      id="output"
      data-testid="output"
    />
    <button
      type="button"
      data-testid="focus-before"
    >
      Focus before
    </button>
    <Tooltip.Root class="tooltip">
      <Tooltip.Trigger
        data-testid="tooltip-trigger"
        data-action="trigger-clicked"
      >
        Hover me
      </Tooltip.Trigger>
      <Tooltip.Content data-testid="tooltip-content">
        Tooltip text
      </Tooltip.Content>
    </Tooltip.Root>
    <button
      type="button"
      data-testid="focus-between"
    >
      Focus between
    </button>
    <Tooltip.Root class="tooltip">
      <Tooltip.Trigger data-testid="second-trigger">
        Second
      </Tooltip.Trigger>
      <Tooltip.Content data-testid="second-content">
        Second tooltip
      </Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root class="tooltip">
      <Tooltip.Trigger
        data-testid="disabled-trigger"
        aria-disabled="true"
      >
        Disabled
      </Tooltip.Trigger>
      <Tooltip.Content data-testid="disabled-content">
        Disabled tooltip
      </Tooltip.Content>
    </Tooltip.Root>
    <Popover.Root class="popover">
      <Popover.Trigger data-testid="popover-trigger">
        Popover
      </Popover.Trigger>
      <Popover.Content data-testid="popover-content">
        <p>Popover content</p>
      </Popover.Content>
    </Popover.Root>
    <Menu.Root>
      <Menu.Trigger data-testid="menu-trigger">
        Menu
      </Menu.Trigger>
      <Menu.Popover data-testid="menu-list">
        <Menu.Item data-testid="menu-item-1">
          Menu Item 1
        </Menu.Item>
      </Menu.Popover>
    </Menu.Root>
  </div>
</template>
