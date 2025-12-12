<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useFisherStore } from "@/stores/fisherStore";
import { useRouter } from "vue-router";
import type { Fisher, UpgradeType } from "@/types";
import PixelButton from "@/components/PixelButton.vue";

const router = useRouter();

const props = defineProps<{ fisherId: number }>();
const store = useFisherStore();

const timeNow = ref(Date.now());

const fisher = computed(() => store.activeFisher as Fisher | null);
const isInitialLoading = ref(true);

const fmt = (n: unknown, digits = 2) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(digits) : "0.00";

const upgradeButtons: { type: UpgradeType; label: string }[] = [
  { type: "CLICK_FLAT", label: "Better Rod" },
  { type: "CLICK_LUCK_RATE", label: "Lucky Bait" },
  { type: "CLICK_LUCK_MULTIPLIER", label: "Treasure Hook" },
  { type: "CLICK_MASTERY_MULTIPLIER", label: "Mastery" },
  { type: "PASSIVE_FISH_RATE", label: "Auto Speed" },
  { type: "PASSIVE_FISH_AMOUNT", label: "Auto Amount" },
];

// dynamic level lookup based on backend map
function levelOf(type: UpgradeType): number {
  const f = fisher.value;
  if (!f) return 1; // backend starts at 1

  const levels = f.upgradeLevels;
  if (levels && typeof levels[type] === "number") {
    return levels[type] as number;
  }

  // fallback if field missing; prevents "Lv 0"
  return 1;
}

// mirror backend cost formula based on CURRENT level
function costOf(type: UpgradeType): number {
  const level = levelOf(type);
  const rounded = Math.round(Math.pow(1.15, level) * 10);
  return rounded;
}

async function buy(type: UpgradeType) {
  await store.buyUpgrade(type);
}

const progressPercent = computed(() => {
  const p = fisher.value?.fishProgress ?? 0;
  const max = 10;
  return Math.min(100, Math.max(0, (p / max) * 100));
});

/**
 * AUTO-FISH TIMER
 */
const nextAutoMs = ref<number | null>(null);

const nextAutoSeconds = computed(() => {
  if (nextAutoMs.value == null) return null;
  return Math.ceil(nextAutoMs.value / 1000);
});

// progress of current passive tick [0–100]
const autoProgress = computed(() => {
  const f = fisher.value;
  if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
    return 0;
  }
  const tickDuration = f.passiveFishSpeedMultiplier;
  const last = f.lastPassiveTickMillis;
  const elapsed = timeNow.value - last;
  const ratio = Math.max(0, Math.min(1, elapsed / tickDuration));
  return ratio * 100;
});

let timerInterval: number | null = null;

function updateCountdownOnly() {
  const f = fisher.value;
  if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
    nextAutoMs.value = null;
    return;
  }
  const tickDuration = f.passiveFishSpeedMultiplier;
  const last = f.lastPassiveTickMillis;
  const now = Date.now();
  const elapsed = now - last;
  const clamped = Math.max(0, Math.min(tickDuration, elapsed));
  const remaining = tickDuration - clamped;
  nextAutoMs.value = Math.max(0, Math.round(remaining));
}

async function checkAndDoPassiveTick() {
  const f = fisher.value;
  if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
    updateCountdownOnly();
    return;
  }

  const tickDuration = f.passiveFishSpeedMultiplier;
  const last = f.lastPassiveTickMillis;
  const now = Date.now();
  const elapsed = now - last;

  // Only call backend if at least one full tick has passed
  if (elapsed >= tickDuration) {
    await store.passiveTick();
  }

  updateCountdownOnly();
}

function startTimer() {
  stopTimer();
  updateCountdownOnly();

  timerInterval = window.setInterval(() => {
    timeNow.value = Date.now(); // makes autoProgress move
    void checkAndDoPassiveTick();
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

onMounted(async () => {
  await store.loadFisher(props.fisherId);
  isInitialLoading.value = false;
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <main class="game">
    <div class="content">
      <div v-if="isInitialLoading">Loading Fisher...</div>

      <div v-else-if="!fisher">Failed to load Fisher.</div>

      <div v-else class="panel">
        <h1 class="title">{{ fisher.name }}</h1>
        <p class="fish-count">Fish: <b>{{ fisher.fishAmount }}</b></p>

        <div class="row">
          <PixelButton @click="store.click()">🎣 Fish!</PixelButton>

          <div class="nav">
            <PixelButton @click="router.push(`/`)">⬅ Back</PixelButton>
            <PixelButton @click="router.push('/leaderboard')">🏆 Leaderboard</PixelButton>
          </div>
        </div>

        <!-- Manual click progress bar -->
        <div class="section">
          <div class="section-label">Progress: {{ fisher.fishProgress }}/10</div>
          <div class="bar">
            <div class="bar-fill" :style="{ width: progressPercent + '%' }" />
          </div>
        </div>

        <!-- Auto-fish timer + bar -->
        <div class="section">
          <div class="section-label">
            Next auto fish in:
            <span v-if="nextAutoSeconds !== null">{{ nextAutoSeconds }}s</span>
            <span v-else>–</span>
          </div>
          <div class="bar bar--small">
            <div class="bar-fill bar-fill--blue" :style="{ width: autoProgress + '%' }" />
          </div>
        </div>

        <h2 class="h2">Stats</h2>
        <ul class="stats">
          <li>Total Fish: {{ fisher.totalFishAmount }}</li>
          <li>Base Pull: {{ fisher.baseFishPull }}</li>
          <li>Luck Rate: {{ fisher.luckRate ?? 0 }}%</li>
          <li>Luck Multiplier: x{{ fmt(fisher.luckMultiplier) }}</li>
          <li>Mastery Multiplier: x{{ fmt(fisher.masteryMultiplier) }}</li>
          <li>Passive Delay: {{ fmt(fisher.passiveFishSpeedMultiplier, 0) }} ms</li>
          <li>Passive Fish/Tick: {{ fisher.passiveFishPerPull ?? 0 }}</li>
        </ul>

        <h2 class="h2">Upgrades</h2>
        <div class="upgrade-grid">
          <PixelButton
            v-for="u in upgradeButtons"
            :key="u.type"
            size="large"
            @click="buy(u.type)"
            :disabled="fisher.fishAmount < costOf(u.type)"
          >
            {{ u.label }} (Lv {{ levelOf(u.type) }}) – {{ costOf(u.type) }} Fish
          </PixelButton>
        </div>

        <p v-if="store.error" class="error">
          {{ store.error }}
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Full-screen game layout */
.game {
  width: 100vw;
  height: 100vh;
  display: flex;
}

/* Scroll INSIDE the game, so you can still reach bottom UI even if body overflow is hidden */
.content {
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
  padding: 24px;
  box-sizing: border-box;
}

/* A readable panel area (optional) */
.panel {
  max-width: 1100px;
  margin: 0 auto;
}

.title {
  margin: 0 0 6px 0;
}

.fish-count {
  margin: 0 0 16px 0;
}

.row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.nav {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.section {
  margin-top: 16px;
}

.section-label {
  font-size: 14px;
  margin-bottom: 6px;
}

.bar {
  height: 14px;
  background: rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  overflow: hidden;
}

.bar--small {
  height: 10px;
}

.bar-fill {
  height: 100%;
  width: 0%;
  background: #22c55e;
  transition: width 0.2s ease;
}

.bar-fill--blue {
  background: #3b82f6;
  transition: width 0.2s linear;
}

.h2 {
  margin-top: 22px;
  margin-bottom: 10px;
}

.stats {
  margin: 0;
  padding-left: 18px;
}

.upgrade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.error {
  color: red;
  margin-top: 12px;
}
</style>
