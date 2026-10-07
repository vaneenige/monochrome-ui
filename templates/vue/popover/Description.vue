<script setup lang="ts">
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const { id } = useRoot();
</script>

<template>
  <p v-bind="$attrs" data-slot="popover-description" :id="`mcc:popover-description:${id}`"><slot /></p>
</template>
