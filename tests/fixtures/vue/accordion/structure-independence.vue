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
      <Accordion.Header as="div">
        <Accordion.Trigger data-testid="div-trigger">
          Div header
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel data-testid="div-content">
        <p>Div panel</p>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
</template>
