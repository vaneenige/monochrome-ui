<script setup lang="ts">
import { provide, useId } from "vue";
import { RootKey } from "./context";

defineOptions({ inheritAttrs: false });
provide(RootKey, { id: useId() });
</script>

<template>
  <div v-bind="$attrs" data-slot="dialog"><slot /></div>
</template>
