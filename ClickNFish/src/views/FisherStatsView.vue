<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFisherStore } from "@/stores/fisherStore";
import type { Fisher } from "@/types";
import PixelButton from "@/components/PixelButton.vue";

const route = useRoute();
const router = useRouter();
const store = useFisherStore();

const fisherId = Number(route.params.fisherId);
const isLoading = ref(true);

const fisher = computed(() => store.activeFisher as Fisher | null);

const fmt = (n: unknown, digits = 2) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(digits) : "0.00";

onMounted(async () => {
  await store.loadFisher(fisherId);
  isLoading.value = false;
});
</script>

<template>
  <main class="stats-page">
    <div class="topbar">
      <PixelButton @click="router.back()">⬅ Back</PixelButton>
      <PixelButton @click="router.push('/')">🏠 Home</PixelButton>
    </div>

    <div v-if="isLoading">Loading stats…</div>
    <div v-else-if="!fisher">Failed to load Fisher.</div>

    <div v-else class="scroll">
      <!-- Header row -->
      <div class="header">
        <img
          class="fisher-pfp"
          src="@/assets/fisher_pfp.png"
          alt="Fisher portrait"
        />

        <h1 class="title">{{ fisher.name }} — Stats</h1>
      </div>

      <ul class="stats">
        <li><b>Total Fish:</b> {{ fisher.totalFishAmount }}</li>
        <li><b>Fish (current):</b> {{ fisher.fishAmount }}</li>
        <li><b>Base Pull:</b> {{ fisher.baseFishPull }}</li>
        <li><b>Luck Rate:</b> {{ fisher.luckRate ?? 0 }}%</li>
        <li><b>Luck Multiplier:</b> x{{ fmt(fisher.luckMultiplier) }}</li>
        <li><b>Mastery Multiplier:</b> x{{ fmt(fisher.masteryMultiplier) }}</li>
        <li><b>Passive Delay:</b>
          {{ fmt(fisher.passiveFishSpeedMultiplier, 0) }} ms
        </li>
        <li><b>Passive Fish/Tick:</b> {{ fisher.passiveFishPerPull ?? 0 }}</li>
      </ul>

      <p v-if="store.error" class="error">{{ store.error }}</p>
    </div>
  </main>
</template>

<style scoped>
.stats-page {
  width: 100vw;
  height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;
}

/* top navigation */
.topbar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

/* parchment scroll */
.scroll {
  max-width: 700px;
  height: 550px;
  margin: 0 auto;

  padding: 64px 96px;
  box-sizing: border-box;

  background: url("@/assets/scroll.png") no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;

  color: #3b2f1c;
  overflow: auto;
}

/* header row: portrait + title */
.header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

/* fisher portrait */
.fisher-pfp {
  width: 96px;
  height: 96px;

  object-fit: cover;
  image-rendering: pixelated;

  border: 3px solid #5a4527;
  background: #e8dcc2;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
}

/* title */
.title {
  margin: 0;
  font-weight: 600;
}

/* stats list */
.stats {
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
}

.stats li {
  margin-bottom: 8px;
}

.stats b {
  color: #2a2013;
  font-weight: 600;
}

/* errors */
.error {
  color: #8b0000;
  margin-top: 12px;
}
</style>
