<script setup lang="ts">
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    kind: "menuitem" | "menuitemcheckbox" | "menuitemradio";
    disabled?: boolean;
    href?: string;
    defaultChecked?: boolean;
    keepOpen?: boolean;
  }>(),
  { disabled: false, defaultChecked: false, keepOpen: false },
);
const attrs = useAttrs();
const shared = computed(() => {
  const { onClick, ...rest } = attrs;
  return {
    ...rest,
    "data-slot": "menu-item",
    role: props.kind,
    tabindex: attrs.tabindex ?? -1,
    "aria-checked": props.kind === "menuitem" ? undefined : props.defaultChecked,
    "data-mc-keep-open": props.keepOpen ? "" : undefined,
  };
});
</script>

<template>
  <li role="none">
    <span v-if="disabled" v-bind="shared" aria-disabled="true"><slot /></span>
    <a v-else-if="href" v-bind="shared" :href="href" @click="attrs.onClick"><slot /></a>
    <button v-else v-bind="shared" type="button" @click="attrs.onClick"><slot /></button>
  </li>
</template>
