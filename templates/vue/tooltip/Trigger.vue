<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const { id } = useRoot();
</script>

<template>
  <button
    v-bind="$attrs"
    data-slot="tooltip-trigger"
    type="button"
    :id="`mct:tooltip:${id}`"
    :aria-describedby="`mcc:tooltip:${id}`"
  >
    <slot />
  </button>
</template>
