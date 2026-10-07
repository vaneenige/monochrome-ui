<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const { id } = useRoot();
</script>

<template>
  <button v-bind="$attrs" data-slot="dialog-close" type="button" :id="`mct:dialog-close:${id}`">
    <slot />
  </button>
</template>
