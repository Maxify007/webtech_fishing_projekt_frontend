<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;          // 0..100
    width?: number;         // px
    height?: number;        // px
    inset?: number;         // px padding inside the frame
    fillRgb?: string;       // "34 197 94" (Tailwind green-500)
    fillAlpha?: number;     // 0..1
  }>(),
  {
    width: 220,
    height: 16,
    inset: 8,
    fillRgb: "34 197 94",
    fillAlpha: 0.75,
  }
);

const p = computed(() => `${Math.min(100, Math.max(0, props.value))}%`);
</script>

<template>
  <div
    class="pixelbar"
    :style="{
      width: width + 'px',
      height: height + 'px',
      padding: inset + 'px',
      '--p': p,
      '--fill': fillRgb,
      '--a': String(fillAlpha),
    }"
  />
</template>

<style scoped>
.pixelbar {
  box-sizing: border-box;
  image-rendering: pixelated;

  /* Layer 1 = fill, clipped to content area (inside padding)
     Layer 2 = PNG frame, covers whole element */
  background-image:
    linear-gradient(
      to right,
      rgb(var(--fill) / var(--a)) 0,
      rgb(var(--fill) / var(--a)) 100%
    ),
    url("@/assets/progressbar.png");

  background-repeat: no-repeat, no-repeat;

  /* Fill width = --p, PNG = full */
  background-size: var(--p) 100%, 100% 100%;

  /* Put fill inside the padding area, PNG across everything */
  background-origin: content-box, border-box;
  background-clip: content-box, border-box;
}
</style>
