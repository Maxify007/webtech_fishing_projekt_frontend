<script setup lang="ts">
defineProps<{
  scale?: number;
  variant?: "gold" | "silver" | "bronze";
}>();
</script>

<template>
  <section
    class="frame"
    :class="variant"
    :style="{
      width: 938 * (scale ?? 1) + 'px',
      height: 900 * (scale ?? 1) + 'px'
    }"
  >
    <div class="inner">
      <div class="slot pixel-font">
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

  transition: filter 0.2s ease;
}

/* 🥇 GOLD WOOD */
.frame.gold {
  filter: sepia(0.9) saturate(1.8) hue-rotate(10deg) brightness(1.05) contrast(1.5);
}

/* 🥈 SILVER WOOD */
.frame.silver {
  filter: grayscale(0.90) brightness(1.1) contrast(1.35);
}

/* 🥉 BRONZE WOOD */
.frame.bronze {
  filter: sepia(0.8) saturate(1.8) hue-rotate(-15deg) brightness(0.95) contrast(1.3);
}

/* inner area unchanged */
.inner {
  width: 72%;
  height: 66%;
}

.slot {
  height: 100%;
}
</style>
