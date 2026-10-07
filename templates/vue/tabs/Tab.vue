<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { part, useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{ value: string; defaultSelected?: boolean; disabled?: boolean }>(),
  { defaultSelected: undefined, disabled: false },
);
const root = useRoot();
const attrs = useAttrs();
const tab = computed(() => part(root.id, props.value));
const isSelected = computed(() => props.defaultSelected ?? props.value === root.selected);
const bound = computed(() => {
  const { onClick, ...rest } = attrs;
  return props.disabled ? rest : attrs;
});
</script>

<template>
  <button
    v-bind="bound"
    data-slot="tabs-tab"
    type="button"
    role="tab"
    :id="`mct:tabs:${tab}`"
    :aria-selected="isSelected"
    :aria-controls="`mcc:tabs:${tab}`"
    :tabindex="isSelected ? 0 : -1"
    :aria-disabled="disabled || undefined"
  >
    <slot />
  </button>
</template>
