<script setup lang="ts">
import { Collapsible } from "monochrome/vue"
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
    <Collapsible.Root>
      <Collapsible.Trigger
        data-testid="collapsible-trigger"
        data-action="trigger-clicked"
      >
        <svg
          data-testid="svg-icon"
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
        Show more information
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="collapsible-content">
        <p>This is the hidden content that is revealed when you click the trigger.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
    <button
      type="button"
      data-testid="focus-after"
    >
      Focus after
    </button>
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="search-trigger">
        Hidden searchable content
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="search-content">
        <p>UNIQUE_SEARCH_STRING_COLLAPSIBLE is hidden here</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
</template>
