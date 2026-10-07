<script setup lang="ts">
import { Popover } from "@/components/ui/popover";
</script>

<template>
  <Popover.Root>
    <Popover.Trigger>Share</Popover.Trigger>
    <Popover.Content>
      <Popover.Description>Anyone with the link can view this file.</Popover.Description>
      <input type="text" value="https://example.com/f/42" aria-label="Link" readonly />
      <button type="button">Copy link</button>
    </Popover.Content>
  </Popover.Root>
</template>
