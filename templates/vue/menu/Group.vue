<script setup lang="ts">
import { useId } from "vue";
import Label from "./Label.vue";

defineOptions({ inheritAttrs: false });
defineProps<{ label?: string }>();
const id = `mcc:menu-label:${useId()}`;
</script>

<template>
  <li role="none">
    <ul :aria-labelledby="label ? id : undefined" v-bind="$attrs" data-slot="menu-group" role="group">
      <Label v-if="label" :id="id">{{ label }}</Label>
      <slot />
    </ul>
  </li>
</template>
