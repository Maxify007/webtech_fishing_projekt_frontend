<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean;
  size?: "normal" | "large";
}>();
</script>

<template>
  <button
    class="pixel-button"
    :class="`size-${props.size ?? 'normal'}`"
    :disabled="props.disabled"
    type="button"
  >
    <span class="label"><slot /></span>
  </button>
</template>

<style scoped>
.pixel-button {
  height: 64px;
  min-width: 220px;

  background-image: url("@/assets/button.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;

  border: none;
  background-color: transparent;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  image-rendering: pixelated;

  /* animation feel */
  transform: translateY(0);
  transition: transform 0.06s steps(2, end), filter 0.1s linear;
}

/* hover pop */
.pixel-button:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* CLICK animation */
.pixel-button:active:not(:disabled) {
  transform: translateY(2px) scale(0.99);
  filter: brightness(0.95);
}

.pixel-button:not(:disabled):focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 3px;
}

/* sizes */
.size-normal {
  padding: 0 22px;
  height: 85px;
}
.size-normal .label {
  font-size: 18px;
}

.size-large {
  height: 120px;
  padding: 0 28px;
}
.size-large .label {
  font-size: 18px;
}
/* SMALL (for framed cards) */
.size-small {
  height: 48px;
  min-width: 180px;
  padding: 0 16px;
}

.size-small .label {
  font-size: 14px;
}

.label {
  font-family: "PixelFont", monospace;
  line-height: 1;
  color: #cbd5e1;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  user-select: none;
}

/* disabled */
.pixel-button:disabled {
  opacity: 0.6;
  cursor: default;
  filter: none;
  transform: none;
}
</style>
