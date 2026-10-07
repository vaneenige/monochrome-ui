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
    data-slot="dialog-trigger"
    type="button"
    :id="`mct:dialog-open:${id}`"
    aria-haspopup="dialog"
    :aria-controls="`mcc:dialog:${id}`"
    :aria-disabled="disabled ? 'true' : attrs['aria-disabled']"
  >
    <slot />
  </button>
</template>
