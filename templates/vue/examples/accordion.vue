<script setup lang="ts">
import { Accordion } from "@/components/ui/accordion";
</script>

<template>
  <Accordion.Root>
    <Accordion.Item default-open>
      <Accordion.Header>
        <Accordion.Trigger>What is monochrome?</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        <p>Accessible, HTML-first components driven by ARIA attributes.</p>
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item>
      <Accordion.Header>
        <Accordion.Trigger>Does it need a framework?</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        <p>No. Plain HTML works; the Vue parts render the same markup.</p>
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item disabled>
      <Accordion.Header>
        <Accordion.Trigger>Coming soon</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        <p>Disabled sections stay closed and are skipped by the arrow keys.</p>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
</template>
