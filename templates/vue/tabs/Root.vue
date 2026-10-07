<script setup lang="ts">
import { provide, reactive, toRef, useId } from "vue";
import { RootKey } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{ defaultValue: string; orientation?: "horizontal" | "vertical" }>(),
  { orientation: "horizontal" },
);
const id = useId();
provide(
  RootKey,
  reactive({
    id,
    selected: toRef(props, "defaultValue"),
    orientation: toRef(props, "orientation"),
  }),
);
</script>

<template>
  <div v-bind="$attrs" data-slot="tabs" :id="`mcr:tabs:${id}`"><slot /></div>
</template>
