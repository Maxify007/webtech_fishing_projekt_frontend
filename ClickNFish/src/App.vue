<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";

const baseWidth = 1920;
const baseHeight = 1080;

function updateScale() {
  const scaleX = window.innerWidth / baseWidth;
  const scaleY = window.innerHeight / baseHeight;

  // pick the limiting dimension
  let scale = Math.min(scaleX, scaleY);

  // don't make it bigger than original size
  scale = Math.min(scale, 1);

  // don't let it get ridiculously small (tweak this)
  scale = Math.max(scale, 0.95);

  const app = document.getElementById("app");
  if (!app) return;

  app.style.transform = `scale(${scale})`;
  app.style.transformOrigin = "top left";
}

onMounted(() => {
  updateScale();
  window.addEventListener("resize", updateScale);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScale);
});

</script>

<template>
  <router-view />
</template>
