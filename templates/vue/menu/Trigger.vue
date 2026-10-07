<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { useMenu } from "./context";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false });
const { id, item } = useMenu();
const attrs = useAttrs();
const bound = computed(() => {
  const { onClick, ...rest } = attrs;
  return props.disabled ? rest : attrs;
});
</script>

<template>
  <button
    v-bind="bound"
    data-slot="menu-trigger"
    type="button"
    :id="`mct:menu:${id}`"
    :aria-controls="`mcc:menu:${id}`"
    aria-expanded="false"
    aria-haspopup="menu"
    :tabindex="attrs.tabindex ?? (item ? -1 : 0)"
    :role="item ? 'menuitem' : 'button'"
    :aria-disabled="disabled ? 'true' : attrs['aria-disabled']"
  >
    <slot />
  </button>
</template>
