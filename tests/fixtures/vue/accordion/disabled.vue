<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <div>
    <button
      type="button"
      data-testid="focus-before"
    >
      Focus before
    </button>
    <Accordion.Root
      type="single"
      data-testid="disabled-accordion"
    >
      <Accordion.Item data-testid="disabled-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="disabled-trigger-1">
            Section 1
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="disabled-content-1">
          <p>Content for section 1</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item
        :disabled="true"
        data-testid="disabled-item-2"
      >
        <Accordion.Header>
          <Accordion.Trigger data-testid="disabled-trigger-2">
            Section 2 (Disabled)
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="disabled-content-2">
          <p>Content for section 2 (disabled)</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="disabled-item-3">
        <Accordion.Header>
          <Accordion.Trigger data-testid="disabled-trigger-3">
            Section 3
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="disabled-content-3">
          <p>Content for section 3</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
    <button
      type="button"
      data-testid="focus-after"
    >
      Focus after
    </button>
  </div>
</template>
