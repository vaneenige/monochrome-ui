<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <div>
    <Accordion.Root
      type="single"
      data-testid="heading-accordion"
    >
      <Accordion.Item data-testid="heading-item-1">
        <Accordion.Header as="h2">
          <Accordion.Trigger data-testid="heading-trigger-1">
            H2 Section 1
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="heading-content-1">
          <p>Content with h2 heading</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="heading-item-2">
        <Accordion.Header as="h2">
          <Accordion.Trigger data-testid="heading-trigger-2">
            H2 Section 2
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="heading-content-2">
          <p>Content with h2 heading</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </div>
</template>
