<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false });
const { id } = useRoot();
const attrs = useAttrs();
const bound = computed(() => {
  const { onClick, ...rest } = attrs;
  return props.disabled ? rest : attrs;
});
</script>

<template>
  <button
    v-bind="bound"
    data-slot="popover-trigger"
    type="button"
    :id="`mct:popover:${id}`"
    :aria-controls="`mcc:popover:${id}`"
    aria-expanded="false"
    :aria-disabled="disabled ? 'true' : attrs['aria-disabled']"
  >
    <slot />
  </button>
</template>
