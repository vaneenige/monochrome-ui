<script setup lang="ts">
import { Collapsible } from "monochrome/vue"
</script>

<template>
  <div>
    <Collapsible.Root :disabled="true">
      <Collapsible.Trigger data-testid="collapsible-trigger">
        Show more information
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="collapsible-content">
        <p>This content stays hidden while the trigger is disabled.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
</template>
