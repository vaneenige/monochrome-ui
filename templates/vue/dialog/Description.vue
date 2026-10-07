<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const { id } = useRoot();
</script>

<template>
  <p v-bind="$attrs" data-slot="dialog-description" :id="`mcc:dialog-description:${id}`"><slot /></p>
</template>
