<script setup lang="ts">
import { Menubar } from "@/components/ui/menubar";
</script>

<template>
  <Menubar.Root aria-label="Main">
    <Menubar.Item href="/" :tabindex="0">Home</Menubar.Item>
    <Menubar.Menu>
      <Menubar.Trigger>Products</Menubar.Trigger>
      <Menubar.Popover>
        <Menubar.Item href="/chat">Chat</Menubar.Item>
        <Menubar.Item href="/video">Video</Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
    <Menubar.Menu>
      <Menubar.Trigger>Docs</Menubar.Trigger>
      <Menubar.Popover>
        <Menubar.Item href="/docs/start">Getting started</Menubar.Item>
        <Menubar.Item href="/docs/api">API reference</Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
  </Menubar.Root>
</template>
