<script setup lang="ts">
import { useAttrs } from "vue";
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
defineProps<{
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}>();
const { id } = useRoot();
const attrs = useAttrs();
</script>

<template>
  <div
    :data-mc-side="side"
    :data-mc-align="align"
    role="dialog"
    :aria-labelledby="'aria-label' in attrs ? undefined : `mct:popover:${id}`"
    :aria-describedby="'aria-description' in attrs ? undefined : `mcc:popover-description:${id}`"
    v-bind="$attrs"
    data-slot="popover-content"
    :id="`mcc:popover:${id}`"
    popover="manual"
    tabindex="-1"
  >
    <slot />
  </div>
</template>
