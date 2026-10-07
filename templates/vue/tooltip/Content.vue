<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
defineProps<{
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}>();
const { id } = useRoot();
</script>

<template>
  <div
    :data-mc-side="side"
    :data-mc-align="align"
    v-bind="$attrs"
    data-slot="tooltip-content"
    :id="`mcc:tooltip:${id}`"
    role="tooltip"
    popover="manual"
  >
    <slot />
  </div>
</template>
