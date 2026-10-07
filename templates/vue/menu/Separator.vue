<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<template>
  <li v-bind="$attrs" data-slot="menu-separator" role="separator" />
</template>
