<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <div>
    <Accordion.Root
      type="multiple"
      data-testid="rich-accordion"
    >
      <Accordion.Item data-testid="rich-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="rich-trigger-1">
            Section with Form
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="rich-content-1">
          <form>
            <label>
              Name:
              <input
                type="text"
                data-testid="rich-input"
              >
            </label>
            <button
              type="button"
              data-testid="rich-button"
            >
              Submit
            </button>
          </form>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="rich-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="rich-trigger-2">
            Section with List
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="rich-content-2">
          <ul>
            <li>Item A</li>
            <li>Item B</li>
            <li>Item C</li>
          </ul>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </div>
</template>
