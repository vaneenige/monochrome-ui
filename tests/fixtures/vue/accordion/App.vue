<script setup lang="ts">
import { ref } from "vue"
import { Accordion } from "monochrome/vue"

const items = ref([
  { label: "Section 1", content: "Content 1" },
  { label: "Section 2", content: "Content 2" },
  { label: "Section 3", content: "Content 3" },
])
const disabledIndex = ref<number | null>(null)
const output = ref("")
const mode = ref<"single" | "multiple">("single")

function addItem() {
  items.value = [...items.value, {
    label: `Section ${items.value.length + 1}`,
    content: `Content ${items.value.length + 1}`,
  }]
}

function removeItem() {
  items.value = items.value.slice(0, -1)
}

function toggleDisabled() {
  disabledIndex.value = disabledIndex.value === 1 ? null : 1
}

function toggleMode() {
  mode.value = mode.value === "single" ? "multiple" : "single"
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
        data-testid="toggle-disabled"
        @click="toggleDisabled"
      >
        Toggle Disabled Item 2
      </button>
      <button
        type="button"
        data-testid="toggle-mode"
        @click="toggleMode"
      >
        Toggle Mode
      </button>
    </div>
    <Accordion.Root
      :type="mode"
      class="accordion-root"
      data-testid="accordion-root"
    >
      <Accordion.Item
        v-for="(item, i) in items"
        :key="item.label"
        :data-testid="`item-${i + 1}`"
        :disabled="disabledIndex === i"
      >
        <Accordion.Header>
          <Accordion.Trigger
            :data-testid="`trigger-${i + 1}`"
            @click="output = `trigger-${i + 1}-clicked`"
          >
            {{ item.label }}
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel :data-testid="`content-${i + 1}`">
          <p>{{ item.content }}</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
    <Accordion.Root
      type="single"
      data-testid="accordion2-root"
    >
      <Accordion.Item data-testid="accordion2-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="accordion2-trigger-1">
            A2 Section 1
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="accordion2-content-1">
          <p>A2 Content 1</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="accordion2-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="accordion2-trigger-2">
            A2 Section 2
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="accordion2-content-2">
          <p>A2 Content 2</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </div>
</template>
