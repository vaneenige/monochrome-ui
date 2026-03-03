<script setup lang="ts">
import { Menu } from "monochrome/vue"
</script>

<template>
  <div>
    <div
      id="output"
      data-testid="output"
    />
    <div
      data-testid="scroll-container"
      style="width: 200px; height: 200px; overflow: auto"
    >
      <div style="height: 1000px; width: 100%">
        Scroll me!
        <br>
        <div v-for="i in 20" :key="i">
          Item {{ i }}
        </div>
      </div>
    </div>
    <div>
      <button
        type="button"
        data-testid="focus-before"
      >
        Focus before
      </button>
      <Menu.Root class="menu">
        <Menu.Trigger data-testid="root-trigger">
          MenuTrigger
        </Menu.Trigger>
        <Menu.Popover data-testid="root-list">
          <Menu.Item data-testid="root-item-1">
            MenuItem 1
          </Menu.Item>
          <Menu.Item data-testid="root-item-2">
            MenuItem 2
          </Menu.Item>
          <Menu.Item data-testid="root-item-3">
            MenuItem 3
          </Menu.Item>
          <Menu.Group>
            <Menu.Trigger data-testid="root-submenu-trigger">
              Submenu Trigger
            </Menu.Trigger>
            <Menu.Popover data-testid="root-submenu-list">
              <Menu.Item data-testid="root-submenu-item-1">
                Submenu Item 1
              </Menu.Item>
              <Menu.Item data-testid="root-submenu-item-2">
                Submenu Item 2
              </Menu.Item>
              <Menu.Item data-testid="root-submenu-item-3">
                Submenu Item 3
              </Menu.Item>
            </Menu.Popover>
          </Menu.Group>
        </Menu.Popover>
      </Menu.Root>
      <button
        type="button"
        data-testid="focus-after"
      >
        Focus after
      </button>
      <Menu.Root class="menu">
        <Menu.Trigger data-testid="second-trigger">
          Second Menu
        </Menu.Trigger>
        <Menu.Popover data-testid="second-list">
          <Menu.Item data-testid="second-item-1">
            Second Item 1
          </Menu.Item>
          <Menu.Item data-testid="second-item-2">
            Second Item 2
          </Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </div>
    <Menu.Root>
      <Menu.Trigger data-testid="svg-trigger">
        <svg
          data-testid="svg-icon"
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
        Menu with SVG
      </Menu.Trigger>
      <Menu.Popover data-testid="svg-list">
        <Menu.Item data-testid="svg-item-1">
          SVG Menu Item 1
        </Menu.Item>
        <Menu.Item data-testid="svg-item-2">
          SVG Menu Item 2
        </Menu.Item>
      </Menu.Popover>
    </Menu.Root>
    <Menu.Root>
      <Menu.Trigger
        data-testid="trigger"
        data-action="trigger-clicked"
      >
        Open Menu
      </Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.Item
          data-testid="item"
          data-action="item-clicked"
        >
          Action
        </Menu.Item>
        <Menu.CheckboxItem
          data-testid="checkbox"
          data-action="checkbox-clicked"
          :checked="false"
        >
          Bold
        </Menu.CheckboxItem>
        <Menu.RadioItem
          data-testid="radio-1"
          data-action="radio-1-clicked"
          :checked="true"
        >
          Light
        </Menu.RadioItem>
        <Menu.RadioItem
          data-testid="radio-2"
          data-action="radio-2-clicked"
          :checked="false"
        >
          Dark
        </Menu.RadioItem>
      </Menu.Popover>
    </Menu.Root>
  </div>
</template>
