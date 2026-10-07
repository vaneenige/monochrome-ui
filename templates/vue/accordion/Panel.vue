<script setup lang="ts">
import { useItem } from "./context";

defineOptions({ inheritAttrs: false });
const item = useItem();
</script>

<template>
  <div
    v-bind="$attrs"
    data-slot="accordion-panel"
    role="region"
    :id="`mcc:accordion:${item.id}`"
    :aria-labelledby="`mct:accordion:${item.id}`"
    :hidden="item.open ? undefined : true"
  >
    <slot />
  </div>
</template>
