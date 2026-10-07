<script setup lang="ts">
import { provide } from "vue";
import { MenuKey } from "../menu/context";

defineOptions({ inheritAttrs: false });
provide(MenuKey, { id: "", item: true });
</script>

<template>
  <ul v-bind="$attrs" data-slot="menubar" role="menubar"><slot /></ul>
</template>
