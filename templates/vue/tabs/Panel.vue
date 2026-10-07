<script setup lang="ts">
import { computed } from "vue";
import { part, useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{ value: string; defaultSelected?: boolean; focusable?: boolean }>(),
  { defaultSelected: undefined, focusable: true },
);
const root = useRoot();
const tab = computed(() => part(root.id, props.value));
const isSelected = computed(() => props.defaultSelected ?? props.value === root.selected);
</script>

<template>
  <div
    v-bind="$attrs"
    data-slot="tabs-panel"
    role="tabpanel"
    :id="`mcc:tabs:${tab}`"
    :aria-labelledby="`mct:tabs:${tab}`"
    :hidden="isSelected ? undefined : true"
    :tabindex="focusable ? (isSelected ? 0 : -1) : undefined"
  >
    <slot />
  </div>
</template>
