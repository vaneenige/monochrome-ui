<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <Accordion.Root>
    <Accordion.Item>
      <Accordion.Header>
        <Accordion.Trigger data-testid="h3-trigger">
          H3 header
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel data-testid="h3-content">
        <p>H3 panel</p>
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item>
      <div>
        <Accordion.Header as="h4">
          <Accordion.Trigger data-testid="h4-trigger">
            H4 header
          </Accordion.Trigger>
        </Accordion.Header>
      </div>
      <Accordion.Panel data-testid="h4-content">
        <p>H4 panel</p>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
</template>
