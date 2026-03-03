<script setup lang="ts">
import { Tabs } from "monochrome/vue"
</script>

<template>
  <div>
    <Tabs.Root
      default-value="vtab1"
      orientation="vertical"
      data-testid="vertical-tabs-container"
    >
      <Tabs.List data-testid="vertical-tablist">
        <Tabs.Tab
          value="vtab1"
          data-testid="vtab-1"
        >
          Vertical Tab 1
        </Tabs.Tab>
        <Tabs.Tab
          value="vtab2"
          data-testid="vtab-2"
        >
          Vertical Tab 2
        </Tabs.Tab>
        <Tabs.Tab
          value="vtab3"
          data-testid="vtab-3"
        >
          Vertical Tab 3
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        value="vtab1"
        data-testid="vpanel-1"
      >
        <p>Content for Vertical Tab 1</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="vtab2"
        data-testid="vpanel-2"
      >
        <p>Content for Vertical Tab 2</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="vtab3"
        data-testid="vpanel-3"
      >
        <p>Content for Vertical Tab 3</p>
      </Tabs.Panel>
    </Tabs.Root>
  </div>
</template>
