<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <Accordion.Root>
    <Accordion.Item>
      <Accordion.Trigger data-testid="bare-trigger">
        Bare
      </Accordion.Trigger>
      <Accordion.Panel data-testid="bare-content">
        <p>Bare panel</p>
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item>
      <Accordion.Header as="h4">
        <Accordion.Trigger data-testid="h4-trigger">
          H4 header
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel data-testid="h4-content">
        <p>H4 panel</p>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
</template>
