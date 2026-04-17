<script setup lang="ts">
import { Menu, Popover } from "monochrome/vue"
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
    <Popover.Root class="popover">
      <Popover.Trigger
        data-testid="click-trigger"
        data-action="trigger-clicked"
      >
        Open
      </Popover.Trigger>
      <Popover.Content data-testid="click-content">
        <p data-testid="click-text">Click content</p>
        <button
          type="button"
          data-testid="copy-button"
          data-action="copy-clicked"
        >
          Copy
        </button>
      </Popover.Content>
    </Popover.Root>
    <button
      type="button"
      data-testid="focus-after"
    >
      Focus after
    </button>
    <Popover.Root class="popover">
      <Popover.Trigger data-testid="second-trigger">
        Second
      </Popover.Trigger>
      <Popover.Content data-testid="second-content">
        <p>Second content</p>
      </Popover.Content>
    </Popover.Root>
    <Popover.Root class="popover">
      <Popover.Trigger
        data-testid="disabled-trigger"
        aria-disabled="true"
      >
        Disabled
      </Popover.Trigger>
      <Popover.Content data-testid="disabled-content">
        <p>Disabled content</p>
      </Popover.Content>
    </Popover.Root>
    <Popover.Root class="popover">
      <Popover.Trigger data-testid="scroll-trigger">
        Scroll
      </Popover.Trigger>
      <Popover.Content data-testid="scroll-content">
        <div
          data-testid="scroll-inner"
          class="scrollable-content"
        >
          <div>Long content to scroll through</div>
        </div>
      </Popover.Content>
    </Popover.Root>
    <Menu.Root class="menu">
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
