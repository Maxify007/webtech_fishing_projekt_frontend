<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getLeaderboard } from "@/services/api";
import type { Fisher } from "@/types";
import { useRouter } from "vue-router";
import PixelButton from "@/components/PixelButton.vue";
import PixelFrame from "@/components/PixelFrame.vue";

const router = useRouter();

const top10 = ref<Fisher[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    top10.value = await getLeaderboard();
  } catch {
    error.value = "Leaderboard konnte nicht geladen werden.";
  } finally {
    loading.value = false;
  }
});

function frameVariant(index: number) {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return undefined;
}
</script>

<template>
  <main class="page">
    <!-- Back -->
    <div class="topbar">
      <PixelButton size="small" @click="router.back()">⬅ Back</PixelButton>
    </div>

    <h1 class="h1">Leaderboard 🏆</h1>

    <div v-if="loading">Loading...</div>
    <p v-else-if="error" class="error">{{ error }}</p>

    <!-- EXACTLY 2 ROWS × 5 -->
    <section v-else class="grid">
      <PixelFrame
        v-for="(f, index) in top10"
        :key="f.fisherId"
        :scale="0.26"
        :variant="frameVariant(index)"
      >
        <div class="frameContent">
          <div class="rank">#{{ index + 1 }}</div>
          <div class="name">{{ f.name }}</div>
          <div class="stat">
            {{ f.totalFishAmount.toLocaleString() }} Fish
          </div>
        </div>
      </PixelFrame>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  scrollbar-gutter: stable;
}

.topbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 14px;
}

.h1 {
  margin: 0 0 16px 0;
}

.error {
  color: red;
  margin-top: 10px;
}

/* EXACT 5 COLUMNS */
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
}

/* Content inside each frame */
.frameContent {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;

  /* visually better inside wood */
  transform: translateY(6px);
}

.rank {
  font-size: 16px;
  font-weight: bold;
}

.name {
  font-size: 17px;
  font-weight: bold;
}

.stat {
  font-size: 14px;
  opacity: 0.9;
}
</style>
