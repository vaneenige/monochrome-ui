<script setup lang="ts">
import { Popover } from "monochrome/vue"
</script>

<template>
  <Popover.Root>
    <header>
      <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
    </header>
    <main data-testid="main">
      <p>Unrelated chrome between the trigger and its content.</p>
    </main>
    <aside>
      <Popover.Content data-testid="content">
        <p>Popover content</p>
        <button type="button" data-testid="inside">
          Inside
        </button>
      </Popover.Content>
    </aside>
  </Popover.Root>
</template>
