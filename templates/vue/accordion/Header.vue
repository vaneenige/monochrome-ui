<script setup lang="ts">
defineOptions({ inheritAttrs: false });
withDefaults(defineProps<{ as?: "h2" | "h3" | "h4" | "h5" | "h6" }>(), { as: "h3" });
</script>

<template>
  <component :is="as" v-bind="$attrs" data-slot="accordion-header"><slot /></component>
</template>
