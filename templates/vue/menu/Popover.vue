<script setup lang="ts">
import { useMenu } from "./context";

defineOptions({ inheritAttrs: false });
defineProps<{
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}>();
const { id } = useMenu();
</script>

<template>
  <ul
    :data-mc-side="side"
    :data-mc-align="align"
    v-bind="$attrs"
    data-slot="menu-content"
    role="menu"
    :id="`mcc:menu:${id}`"
    :aria-labelledby="`mct:menu:${id}`"
    popover="manual"
  >
    <slot />
  </ul>
</template>
