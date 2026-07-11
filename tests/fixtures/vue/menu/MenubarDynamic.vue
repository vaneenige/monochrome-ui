<script setup lang="ts">
import { ref } from "vue"
import { Menubar } from "monochrome/vue"

const showFirst = ref(true)
const extra = ref(false)
</script>

<template>
  <div>
    <div>
      <button
        type="button"
        data-testid="remove-first"
        @click="showFirst = false"
      >
        Remove first
      </button>
      <button
        type="button"
        data-testid="add-extra"
        @click="extra = true"
      >
        Add extra
      </button>
    </div>
    <Menubar.Root data-testid="menubar">
      <Menubar.Menu v-if="showFirst">
        <Menubar.Trigger data-testid="trigger-1">
          File
        </Menubar.Trigger>
        <Menubar.Popover data-testid="list-1">
          <Menubar.Item>New</Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="trigger-2">
          Edit
        </Menubar.Trigger>
        <Menubar.Popover data-testid="list-2">
          <Menubar.Item>Undo</Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
      <Menubar.Menu v-if="extra">
        <Menubar.Trigger data-testid="trigger-3">
          View
        </Menubar.Trigger>
        <Menubar.Popover data-testid="list-3">
          <Menubar.Item>Zoom</Menubar.Item>
        </Menubar.Popover>
      </Menubar.Menu>
    </Menubar.Root>
  </div>
</template>
