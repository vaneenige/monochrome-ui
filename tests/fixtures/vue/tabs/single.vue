<script setup lang="ts">
import { Tabs } from "monochrome/vue"
</script>

<template>
  <div>
    <Tabs.Root
      default-value="single"
     
    >
      <Tabs.List>
        <Tabs.Tab
          value="single"
          data-testid="single-tab"
        >
          Only Tab
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        value="single"
        data-testid="single-panel"
      >
        <p>Content for the only tab</p>
      </Tabs.Panel>
    </Tabs.Root>
  </div>
</template>
