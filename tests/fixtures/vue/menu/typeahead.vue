<script setup lang="ts">
import { Menu } from "monochrome/vue"
</script>

<template>
  <div>
    <fieldset>
      <legend>Cyclic typeahead</legend>
      <Menu.Root>
        <Menu.Trigger data-testid="typeahead-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover data-testid="typeahead-list">
          <Menu.Item data-testid="typeahead-item-1">Apple</Menu.Item>
          <Menu.Item data-testid="typeahead-item-2">Banana</Menu.Item>
          <Menu.Item data-testid="typeahead-item-3">Avocado</Menu.Item>
          <Menu.Item
            data-testid="typeahead-item-4"
            :disabled="true"
          >Apricot</Menu.Item>
          <Menu.Item data-testid="typeahead-item-5">Artichoke</Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </fieldset>
  </div>
</template>
