<script setup lang="ts">
import { Menu } from "@/components/ui/menu";
</script>

<template>
  <Menu.Root>
    <Menu.Trigger>File</Menu.Trigger>
    <Menu.Popover>
      <Menu.Item @click="console.log('new')">New file</Menu.Item>
      <Menu.Item href="/recent">Open recent</Menu.Item>
      <Menu.Item disabled>Revert</Menu.Item>
      <Menu.Sub>
        <Menu.Trigger>Share</Menu.Trigger>
        <Menu.Popover>
          <Menu.Item>Copy link</Menu.Item>
          <Menu.Item>Email</Menu.Item>
        </Menu.Popover>
      </Menu.Sub>
      <Menu.Separator />
      <Menu.CheckboxItem default-checked>Autosave</Menu.CheckboxItem>
      <Menu.Separator />
      <Menu.Group label="Theme">
        <Menu.RadioItem default-checked>Light</Menu.RadioItem>
        <Menu.RadioItem>Dark</Menu.RadioItem>
      </Menu.Group>
    </Menu.Popover>
  </Menu.Root>
</template>
