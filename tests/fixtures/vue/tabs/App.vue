<script setup lang="ts">
import { ref } from "vue"
import { Tabs } from "monochrome/vue"

const tabs = ref([
  { value: "tab1", label: "Tab 1", content: "Content 1" },
  { value: "tab2", label: "Tab 2", content: "Content 2" },
  { value: "tab3", label: "Tab 3", content: "Content 3" },
])
const output = ref("")
const orientation = ref<"horizontal" | "vertical">("horizontal")
const disableTab2 = ref(false)

function addTab() {
  tabs.value = [
    ...tabs.value,
    {
      value: `tab${tabs.value.length + 1}`,
      label: `Tab ${tabs.value.length + 1}`,
      content: `Content ${tabs.value.length + 1}`,
    },
  ]
}

function removeTab() {
  tabs.value = tabs.value.slice(0, -1)
}

function toggleOrientation() {
  orientation.value = orientation.value === "horizontal" ? "vertical" : "horizontal"
}

function toggleDisabled() {
  disableTab2.value = !disableTab2.value
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
        data-testid="add-tab"
        @click="addTab"
      >
        Add Tab
      </button>
      <button
        type="button"
        data-testid="remove-tab"
        @click="removeTab"
      >
        Remove Tab
      </button>
      <button
        type="button"
        data-testid="toggle-orientation"
        @click="toggleOrientation"
      >
        Toggle Orientation
      </button>
      <button
        type="button"
        data-testid="toggle-disabled"
        @click="toggleDisabled"
      >
        Toggle Disabled Tab 2
      </button>
    </div>
    <Tabs.Root
      default-value="tab1"
      :orientation="orientation"
      class="tabs-root"
      data-testid="tabs-root"
    >
      <Tabs.List data-testid="tablist">
        <Tabs.Tab
          v-for="(tab, i) in tabs"
          :key="tab.value"
          :value="tab.value"
          :data-testid="`tab-${i + 1}`"
          :disabled="i === 1 && disableTab2"
          @click="output = `tab-${i + 1}-clicked`"
        >
          {{ tab.label }}
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        v-for="(tab, i) in tabs"
        :key="tab.value"
        :value="tab.value"
        :data-testid="`panel-${i + 1}`"
      >
        <p>{{ tab.content }}</p>
      </Tabs.Panel>
    </Tabs.Root>
    <Tabs.Root
      default-value="t1"
      data-testid="tabs2-root"
    >
      <Tabs.List data-testid="tabs2-tablist">
        <Tabs.Tab
          value="t1"
          data-testid="tabs2-tab-1"
        >
          T1
        </Tabs.Tab>
        <Tabs.Tab
          value="t2"
          data-testid="tabs2-tab-2"
        >
          T2
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        value="t1"
        data-testid="tabs2-panel-1"
      >
        <p>Panel T1</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="t2"
        data-testid="tabs2-panel-2"
      >
        <p>Panel T2</p>
      </Tabs.Panel>
    </Tabs.Root>
  </div>
</template>
