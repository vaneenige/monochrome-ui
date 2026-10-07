<script setup lang="ts">
import { useAttrs } from "vue";
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const root = useRoot();
const attrs = useAttrs();
</script>

<template>
  <div
    :aria-labelledby="attrs.role === 'region' ? `mct:collapsible:${root.id}` : undefined"
    v-bind="$attrs"
    data-slot="collapsible-panel"
    :id="`mcc:collapsible:${root.id}`"
    :hidden="root.open ? undefined : true"
  >
    <slot />
  </div>
</template>
