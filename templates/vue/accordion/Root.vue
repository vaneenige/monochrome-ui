<script setup lang="ts">
import { useId } from "vue";

defineOptions({ inheritAttrs: false });
const id = useId();
</script>

<template>
  <div v-bind="$attrs" data-slot="accordion" :id="`mcr:accordion:${id}`"><slot /></div>
</template>
