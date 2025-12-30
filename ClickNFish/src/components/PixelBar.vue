<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: number;          // 0–100
  width?: number;         // px
  height?: number;        // px
  color?: string;
}>();

const barWidth = computed(() => props.width ?? 220);
const barHeight = computed(() => props.height ?? 16);

const clamped = computed(() =>
  Math.min(100, Math.max(0, props.value))
);
</script>

<template>
  <div
    class="pixel-bar"
    :style="{
      width: barWidth + 'px',
      height: barHeight + 'px'
    }"
  >
    <div
      class="pixel-bar-fill"
      :style="{
        width: clamped + '%',
        backgroundColor: color ?? '#22c55e'
      }"
    />
  </div>
</template>

<style scoped>
.pixel-bar {
  position: relative;
  overflow: hidden;

  /* PNG frame */
  background: url("@/assets/progressbar.png") no-repeat;
  background-size: contain;

  image-rendering: pixelated;
}

.pixel-bar-fill {
  height: 100%;
  transition: width 0.2s linear;
  image-rendering: pixelated;
}
</style>
