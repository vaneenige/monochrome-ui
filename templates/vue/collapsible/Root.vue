<script setup lang="ts">
import { provide, reactive, toRef, useId } from "vue";
import { RootKey } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ defaultOpen?: boolean; disabled?: boolean }>(), {
  defaultOpen: false,
  disabled: false,
});
const id = useId();
provide(
  RootKey,
  reactive({ id, open: toRef(props, "defaultOpen"), disabled: toRef(props, "disabled") }),
);
</script>

<template>
  <div v-bind="$attrs" data-slot="collapsible" :id="`mcr:collapsible:${id}`"><slot /></div>
</template>
