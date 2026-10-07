<script setup lang="ts">
import { provide, reactive, toRef, useId } from "vue";
import { ItemKey } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ defaultOpen?: boolean; disabled?: boolean }>(), {
  defaultOpen: false,
  disabled: false,
});
provide(
  ItemKey,
  reactive({ id: useId(), open: toRef(props, "defaultOpen"), disabled: toRef(props, "disabled") }),
);
</script>

<template>
  <div v-bind="$attrs" data-slot="accordion-item"><slot /></div>
</template>
