<script setup lang="ts">
import { Tabs } from "@/components/ui/tabs";
</script>

<template>
  <Tabs.Root default-value="account">
    <Tabs.List aria-label="Settings">
      <Tabs.Tab value="account">Account</Tabs.Tab>
      <Tabs.Tab value="billing">Billing</Tabs.Tab>
      <Tabs.Tab value="team" disabled>Team</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="account">
      <p>Name, email, and password.</p>
    </Tabs.Panel>
    <Tabs.Panel value="billing">
      <p>Plan and invoices.</p>
    </Tabs.Panel>
    <Tabs.Panel value="team">
      <p>Members and roles.</p>
    </Tabs.Panel>
  </Tabs.Root>
</template>
