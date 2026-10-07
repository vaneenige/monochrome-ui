<script setup lang="ts">
import { Collapsible } from "@/components/ui/collapsible";
</script>

<template>
  <Collapsible.Root>
    <div>
      <h3>Order #4189</h3>
      <Collapsible.Trigger aria-label="Order details">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="1em"
          height="1em"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </Collapsible.Trigger>
    </div>
    <dl>
      <div><dt>Status</dt><dd>Shipped</dd></div>
    </dl>
    <Collapsible.Panel>
      <dl>
        <div><dt>Shipping address</dt><dd>100 Market St, San Francisco</dd></div>
        <div><dt>Items</dt><dd>2x Studio Headphones</dd></div>
      </dl>
    </Collapsible.Panel>
  </Collapsible.Root>
</template>
