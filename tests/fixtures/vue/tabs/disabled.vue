<script setup lang="ts">
import { Tabs } from "monochrome/vue"
</script>

<template>
  <div>
    <button
      type="button"
      data-testid="focus-before"
    >
      Focus before
    </button>
    <Tabs.Root
      default-value="tab1"
      data-testid="tabs-container"
    >
      <Tabs.List data-testid="tablist">
        <Tabs.Tab
          value="tab1"
          data-testid="dtab-1"
        >
          Tab 1
        </Tabs.Tab>
        <Tabs.Tab
          value="tab2"
          :disabled="true"
          data-testid="dtab-2"
        >
          Tab 2 (Disabled)
        </Tabs.Tab>
        <Tabs.Tab
          value="tab3"
          data-testid="dtab-3"
        >
          Tab 3
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        value="tab1"
        data-testid="dpanel-1"
      >
        <p>Content for Tab 1</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="tab2"
        data-testid="dpanel-2"
      >
        <p>Content for Tab 2</p>
      </Tabs.Panel>
      <Tabs.Panel
        value="tab3"
        data-testid="dpanel-3"
      >
        <p>Content for Tab 3</p>
      </Tabs.Panel>
    </Tabs.Root>
    <button
      type="button"
      data-testid="focus-after"
    >
      Focus after
    </button>
  </div>
</template>
