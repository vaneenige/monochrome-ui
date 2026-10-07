<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<template>
  <button type="button" v-bind="$attrs" data-slot="dialog-action"><slot /></button>
</template>
