<script setup lang="ts">
import Row from "./Row.vue";

defineProps<{ disabled?: boolean; href?: string; keepOpen?: boolean }>();
</script>

<template>
  <Row kind="menuitem" :disabled="disabled" :href="href" :keep-open="keepOpen"><slot /></Row>
</template>
