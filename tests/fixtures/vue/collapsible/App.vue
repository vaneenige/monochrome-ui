<script setup lang="ts">
import { ref, nextTick } from "vue"
import { Collapsible } from "monochrome/vue"

const mounted = ref(true)
const startOpen = ref(false)
const output = ref("")

function toggleMount() {
  mounted.value = !mounted.value
}

function toggleOpen() {
  mounted.value = false
  startOpen.value = !startOpen.value
  nextTick(() => {
    mounted.value = true
  })
}
</script>

<template>
  <div>
    <div
      id="output"
      data-testid="output"
    >
      {{ output }}
    </div>
    <div style="margin-bottom: 8px">
      <button
        type="button"
        data-testid="toggle-mount"
        @click="toggleMount"
      >
        {{ mounted ? "Unmount" : "Mount" }}
      </button>
      <button
        type="button"
        data-testid="toggle-open"
        @click="toggleOpen"
      >
        Toggle Open Prop
      </button>
    </div>
    <Collapsible.Root
      v-if="mounted"
      :open="startOpen"
      class="collapsible-root"
      data-testid="collapsible-root"
    >
      <Collapsible.Trigger
        data-testid="trigger"
        @click="output = 'trigger-clicked'"
      >
        Toggle Content
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="content">
        <p>Collapsible content here</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root data-testid="collapsible2-root">
      <Collapsible.Trigger data-testid="collapsible2-trigger">
        Toggle Content 2
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="collapsible2-content">
        <p>Second collapsible content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
</template>
