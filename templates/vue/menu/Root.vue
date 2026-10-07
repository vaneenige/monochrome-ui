<script setup lang="ts">
import { provide, useId } from "vue";
import { MenuKey } from "./context";

provide(MenuKey, { id: useId(), item: false });
</script>

<template>
  <slot />
</template>
