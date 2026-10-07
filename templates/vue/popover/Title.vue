<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
withDefaults(defineProps<{ as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }>(), { as: "h2" });
const { id } = useRoot();
</script>

<template>
  <component :is="as" v-bind="$attrs" data-slot="popover-title" :id="`mcc:popover-title:${id}`">
    <slot />
  </component>
</template>
