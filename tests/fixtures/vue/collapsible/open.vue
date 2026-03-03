<script setup lang="ts">
import { Collapsible } from "monochrome/vue"
</script>

<template>
  <div>
    <Collapsible.Root :open="true">
      <Collapsible.Trigger data-testid="open-collapsible-trigger">
        Hide information
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="open-collapsible-content">
        <p>This content is visible by default and can be hidden.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
</template>
