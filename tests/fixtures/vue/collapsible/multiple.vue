<script setup lang="ts">
import { Collapsible } from "monochrome/vue"
</script>

<template>
  <div>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="multi-trigger-1">
        Section 1
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="multi-content-1">
        <p>Content for section 1</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="multi-trigger-2">
        Section 2
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="multi-content-2">
        <p>Content for section 2</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="multi-trigger-3">
        Section 3
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="multi-content-3">
        <p>Content for section 3</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
</template>
