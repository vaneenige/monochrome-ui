<script setup lang="ts">
import { ref } from "vue"
import { Menu } from "monochrome/vue"

const items = ref(["Item 1", "Item 2", "Item 3"])
const hasSubmenu = ref(false)
const checked = ref(false)
const radio = ref("a")
const disableItem2 = ref(false)

function addItem() {
  items.value = [...items.value, `Item ${items.value.length + 1}`]
}

function removeItem() {
  items.value = items.value.slice(0, -1)
}

function handleItemClick(index: number) {
  document.getElementById("output")!.textContent = `item-${index + 1}-clicked`
}
</script>

<template>
  <div>
    <div
      id="output"
      data-testid="output"
    />
    <div style="margin-bottom: 8px">
      <button
        type="button"
        data-testid="add-item"
        @click="addItem"
      >
        Add Item
      </button>
      <button
        type="button"
        data-testid="remove-item"
        @click="removeItem"
      >
        Remove Item
      </button>
      <button
        type="button"
        data-testid="add-submenu"
        @click="hasSubmenu = true"
      >
        Add Submenu
      </button>
      <button
        type="button"
        data-testid="toggle-checked"
        @click="checked = !checked"
      >
        Toggle Checked
      </button>
      <button
        type="button"
        data-testid="select-radio-b"
        @click="radio = 'b'"
      >
        Select Radio B
      </button>
      <button
        type="button"
        data-testid="toggle-disabled"
        @click="disableItem2 = !disableItem2"
      >
        Toggle Disabled
      </button>
    </div>
    <Menu.Root
      class="menu-root"
      data-testid="menu-root"
    >
      <Menu.Trigger
        data-testid="trigger"
        data-action="trigger-clicked"
      >
        Open Menu
      </Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.Item
          v-for="(item, i) in items"
          :key="item"
          :data-testid="`item-${i + 1}`"
          :data-action="`item-${i + 1}-clicked`"
          :disabled="i === 1 && disableItem2"
          @click="handleItemClick(i)"
        >
          {{ item }}
        </Menu.Item>
        <Menu.Item
          data-testid="item-href"
          href="https://example.com"
        >
          Link Item
        </Menu.Item>
        <Menu.Label data-testid="label">
          Group Label
        </Menu.Label>
        <Menu.Separator data-testid="separator" />
        <Menu.CheckboxItem
          data-testid="checkbox-item"
          :checked="checked"
          @click="checked = !checked"
        >
          Checkbox
        </Menu.CheckboxItem>
        <Menu.RadioItem
          data-testid="radio-a"
          :checked="radio === 'a'"
          @click="radio = 'a'"
        >
          Radio A
        </Menu.RadioItem>
        <Menu.RadioItem
          data-testid="radio-b"
          :checked="radio === 'b'"
          @click="radio = 'b'"
        >
          Radio B
        </Menu.RadioItem>
        <Menu.Group v-if="hasSubmenu">
          <Menu.Trigger data-testid="submenu-trigger">
            Submenu
          </Menu.Trigger>
          <Menu.Popover data-testid="submenu-list">
            <Menu.Item data-testid="submenu-item-1">
              Sub Item 1
            </Menu.Item>
            <Menu.Item data-testid="submenu-item-2">
              Sub Item 2
            </Menu.Item>
          </Menu.Popover>
        </Menu.Group>
      </Menu.Popover>
    </Menu.Root>
    <Menu.Root data-testid="menu2-root">
      <Menu.Trigger data-testid="menu2-trigger">
        Open Menu 2
      </Menu.Trigger>
      <Menu.Popover data-testid="menu2-list">
        <Menu.Item data-testid="menu2-item-1">
          Menu2 Item 1
        </Menu.Item>
      </Menu.Popover>
    </Menu.Root>
  </div>
</template>
