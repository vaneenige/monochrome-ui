<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<template>
  <li v-bind="$attrs" data-slot="menu-label" role="presentation"><slot /></li>
</template>
