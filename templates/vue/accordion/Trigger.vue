<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { useItem } from "./context";

defineOptions({ inheritAttrs: false });
const item = useItem();
const attrs = useAttrs();
const bound = computed(() => {
  const { onClick, ...rest } = attrs;
  return item.disabled ? rest : attrs;
});
</script>

<template>
  <button
    v-bind="bound"
    data-slot="accordion-trigger"
    type="button"
    :id="`mct:accordion:${item.id}`"
    :aria-expanded="item.open"
    :aria-controls="`mcc:accordion:${item.id}`"
    :aria-disabled="item.disabled || undefined"
  >
    <slot />
  </button>
</template>
