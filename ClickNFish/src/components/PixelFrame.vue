<script setup lang="ts">
defineProps<{
  title?: string;
  scale?: number;
}>();
</script>

<template>
  <section
    class="frame"
    :style="{
      width: 938 * (scale ?? 1) + 'px',
      height: 900 * (scale ?? 1) + 'px'
    }"
  >
    <div class="inner">
      <h3 v-if="title" class="title">{{ title }}</h3>

      <!-- 👇 this wrapper is the key -->
      <div class="slot">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.frame {
  background-image: url("@/assets/frame.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;

  image-rendering: pixelated;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* Safe area */
.inner {
  width: 72%;
  height: 60%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  box-sizing: border-box;
}

/* 👇 fill remaining height so child can center vertically */
.slot {
  flex: 1;
  min-height: 0;
}
.title {
  margin: 0;
  font-family: "PixelFont", monospace;
  font-size: 22px;
  line-height: 1;
}
</style>
