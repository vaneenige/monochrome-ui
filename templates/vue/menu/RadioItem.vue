<script setup lang="ts">
import Row from "./Row.vue";

defineProps<{ disabled?: boolean; defaultChecked?: boolean; keepOpen?: boolean }>();
</script>

<template>
  <Row
    kind="menuitemradio"
    :disabled="disabled"
    :default-checked="defaultChecked"
    :keep-open="keepOpen"
  >
    <slot />
  </Row>
</template>
