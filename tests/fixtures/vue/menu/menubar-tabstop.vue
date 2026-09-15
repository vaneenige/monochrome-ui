<script setup lang="ts">
import { Menubar } from "monochrome/vue"
</script>

<template>
  <Menubar.Root data-testid="menubar">
    <Menubar.Item
      tabindex="0"
      href="#docs"
      data-testid="link-1"
    >
      Docs
    </Menubar.Item>
    <Menubar.Menu>
      <Menubar.Trigger data-testid="trigger-1">
        SDKs
      </Menubar.Trigger>
      <Menubar.Popover data-testid="list-1">
        <Menubar.Item data-testid="item-1-1">
          React
        </Menubar.Item>
        <Menubar.Item>Swift</Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
    <Menubar.Menu>
      <Menubar.Trigger
        id="author-id"
        role="author-role"
        data-testid="trigger-2"
      >
        UI Kits
      </Menubar.Trigger>
      <Menubar.Popover data-testid="list-2">
        <Menubar.Item data-testid="item-2-1">
          Chat
        </Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
  </Menubar.Root>
</template>
