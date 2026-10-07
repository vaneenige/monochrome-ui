<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const root = useRoot();
const attrs = useAttrs();
const bound = computed(() => {
  const { onClick, ...rest } = attrs;
  return root.disabled ? rest : attrs;
});
</script>

<template>
  <button
    v-bind="bound"
    data-slot="collapsible-trigger"
    type="button"
    :id="`mct:collapsible:${root.id}`"
    :aria-expanded="root.open"
    :aria-controls="`mcc:collapsible:${root.id}`"
    :aria-disabled="root.disabled || undefined"
  >
    <slot />
  </button>
</template>
