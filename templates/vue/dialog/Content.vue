<script setup lang="ts">
import { useAttrs } from "vue";
import { useRoot } from "./context";

defineOptions({ inheritAttrs: false });
const props = defineProps<{ initialFocus?: "close" | (string & {}) }>();
const { id } = useRoot();
const attrs = useAttrs();
</script>

<template>
  <dialog
    :aria-labelledby="'aria-label' in attrs ? undefined : `mcc:dialog-title:${id}`"
    :aria-describedby="'aria-description' in attrs ? undefined : `mcc:dialog-description:${id}`"
    :data-mc-autofocus="props.initialFocus === 'close' ? `mct:dialog-close:${id}` : props.initialFocus"
    v-bind="$attrs"
    data-slot="dialog-content"
    :id="`mcc:dialog:${id}`"
    tabindex="-1"
  >
    <slot />
  </dialog>
</template>
