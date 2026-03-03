<script setup lang="ts">
import { Tabs } from "monochrome/vue"
</script>

<template>
  <div>
    <Tabs.Root
      default-value="dtab2"
      data-testid="default-second-container"
    >
      <Tabs.List data-testid="default-second-tablist">
        <Tabs.Tab
          value="dtab1"
          data-testid="dtab-1"
        >
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab
          value="dtab2"
          data-testid="dtab-2"
        >
          Tab 2 (Default)
        </Tabs.Tab>
        <Tabs.Tab
          value="dtab3"
          data-testid="dtab-3"
        >
          Tab 3
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        value="dtab1"
        data-testid="dpanel-1"
      >
        <p>Content for Tab 1</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="dtab2"
        data-testid="dpanel-2"
      >
        <p>Content for Tab 2 (default selected)</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="dtab3"
        data-testid="dpanel-3"
      >
        <p>Content for Tab 3</p>
      </Tabs.Panel>
    </Tabs.Root>
  </div>
</template>
