<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const root = useRoot();
</script>

<template>
  <div v-bind="$attrs" data-slot="tabs-list" role="tablist" :aria-orientation="root.orientation">
    <slot />
  </div>
</template>
