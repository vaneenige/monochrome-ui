<script setup lang="ts">
import { provide, useId } from "vue";
import { MenuKey } from "./context";

defineOptions({ inheritAttrs: false });
provide(MenuKey, { id: useId(), item: true });
</script>

<template>
  <li v-bind="$attrs" data-slot="menu-sub" role="none"><slot /></li>
</template>
