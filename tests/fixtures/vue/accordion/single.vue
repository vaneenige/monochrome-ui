<script setup lang="ts">
import { Accordion } from "monochrome/vue"
</script>

<template>
  <div>
    <div
      id="output"
      data-testid="output"
    />
    <button
      type="button"
      data-testid="focus-before"
    >
      Focus before
    </button>
    <Accordion.Root
      type="single"
      data-testid="single-accordion"
    >
      <Accordion.Item data-testid="single-item-1">
        <Accordion.Header>
          <Accordion.Trigger
            data-testid="single-trigger-1"
            data-action="trigger-clicked"
          >
            <svg
              data-testid="svg-icon-1"
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
            Section 1
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="single-content-1">
          <p>Content for section 1. When you open another section, this one closes.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="single-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="single-trigger-2">
            Section 2
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="single-content-2">
          <p>Content for section 2. Only one section can be open at a time.</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="single-item-3">
        <Accordion.Header>
          <Accordion.Trigger data-testid="single-trigger-3">
            Section 3
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="single-content-3">
          <p>Content for section 3. This is the last section.</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
    <button
      type="button"
      data-testid="focus-after"
    >
      Focus after
    </button>
    <Accordion.Root
      type="single"
      data-testid="search-accordion"
    >
      <Accordion.Item data-testid="search-item-1">
        <Accordion.Header>
          <Accordion.Trigger data-testid="search-trigger-1">
            First Section
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="search-content-1">
          <p>Regular content here</p>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item data-testid="search-item-2">
        <Accordion.Header>
          <Accordion.Trigger data-testid="search-trigger-2">
            Hidden Searchable Content
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="search-content-2">
          <p>UNIQUE_SEARCH_STRING_ACCORDION is hidden here</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </div>
</template>
