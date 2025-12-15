<script setup lang="ts">
defineProps<{
  title?: string;
  scale?: number; // 1 = original image size
}>();
</script>

<template>
  <section
    class="board"
    :style="{
      width: 938 * (scale ?? 1) + 'px',
      height: 624 * (scale ?? 1) + 'px'
    }"
  >
    <div class="inner">
      <div v-if="title" class="title">{{ title }}</div>
      <div class="content">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.board {
  background-image: url("@/assets/board.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  image-rendering: pixelated;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Safe area for text/content */
.inner {
  width: 78%;
  height: 70%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

/* Optional header text */
.title {
  font-family: "PixelFont", monospace;
  font-size: 20px;
  line-height: 1;
  text-align: center;
}

/* Main content area */
.content {
  flex: 1;
  min-height: 0;

  font-family: "PixelFont", monospace;
  font-size: 16px;
  line-height: 1.3;

  overflow: auto; /* scroll inside the board if needed */
  padding-right: 6px;
}
</style>
