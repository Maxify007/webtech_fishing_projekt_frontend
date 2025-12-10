<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useFisherStore } from "@/stores/fisherStore";
import { useRouter } from "vue-router";
import type { Fisher, UpgradeType } from "@/types";

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
// mirror backend cost formula based on CURRENT level
function costOf(type: UpgradeType): number {
  const level = levelOf(type);
  const rounded = Math.round(Math.pow(1.15, level) * 10);
  return rounded;
}

async function buy(type: UpgradeType) {
  await store.buyUpgrade(type);
  // store.buyUpgrade already updates activeFisher from backend response
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
    timeNow.value = Date.now();   // makes autoProgress move
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
  <main style="max-width:900px;margin:0 auto;padding:24px;">
    <div v-if="isInitialLoading">Loading Fisher...</div>

    <div v-else-if="!fisher">
      Failed to load Fisher.
    </div>

    <div v-else>
      <h1>{{ fisher.name }}</h1>
      <p>Fish: <b>{{ fisher.fishAmount }}</b></p>

      <button
        @click="store.click()"
        style="padding:12px 18px;font-size:18px;border-radius:10px;border:none;background:#22c55e;color:white;"
      >
        🎣 Fish!
      </button>

      <!-- Manual click progress bar -->
      <div style="margin-top:10px;">
        <div style="font-size:14px;margin-bottom:4px;">
          Progress: {{ fisher.fishProgress }}/10
        </div>
        <div
          style="height:12px;background:#e2e8f0;border-radius:999px;overflow:hidden;"
        >
          <div
            :style="{
              width: progressPercent + '%',
              height: '100%',
              background: '#22c55e',
              transition: 'width 0.2s ease'
            }"
          />
        </div>
      </div>

      <!-- Auto-fish timer + bar -->
      <div style="margin-top:16px;">
        <div style="font-size:14px;margin-bottom:4px;">
          Next auto fish in:
          <span v-if="nextAutoSeconds !== null">{{ nextAutoSeconds }}s</span>
          <span v-else>–</span>
        </div>
        <div
          style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;"
        >
          <div
            :style="{
              width: autoProgress + '%',
              height: '100%',
              background: '#3b82f6',
              transition: 'width 0.2s linear'
            }"
          />
        </div>
      </div>

      <!-- Navigation buttons -->
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button
          @click="router.push(`/`)"
          style="padding:10px 16px;font-size:16px;border-radius:10px;border:none;background:#22c55e;color:white;"
        >
          ⬅ Back
        </button>

        <button
          @click="router.push('/leaderboard')"
          style="padding:10px 16px;font-size:16px;border-radius:10px;border:1px solid #cbd5e1;background:white;"
        >
          🏆 Leaderboard
        </button>
      </div>

      <h2 style="margin-top:20px;">Stats</h2>
      <ul>
        <li>Total Fish: {{fisher.totalFishAmount}}</li>
        <li>Base Pull: {{ fisher.baseFishPull }}</li>
        <li>Luck Rate: {{ fisher.luckRate ?? 0 }}%</li>
        <li>Luck Multiplier: x{{ fmt(fisher.luckMultiplier) }}</li>
        <li>Mastery Multiplier: x{{ fmt(fisher.masteryMultiplier) }}</li>
        <li>Passive Delay: {{ fmt(fisher.passiveFishSpeedMultiplier, 0) }} ms</li>
        <li>Passive Fish/Tick: {{ fisher.passiveFishPerPull ?? 0 }}</li>
      </ul>

      <h2 style="margin-top:20px;">Upgrades</h2>
      <div
        style="
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
          gap:10px;
        "
      >
        <button
          v-for="u in upgradeButtons"
          :key="u.type"
          @click="buy(u.type)"
          :disabled="fisher.fishAmount < costOf(u.type)"
          :style="{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: 'white',
            opacity: fisher.fishAmount < costOf(u.type) ? 0.6 : 1,
            cursor: fisher.fishAmount < costOf(u.type) ? 'not-allowed' : 'pointer'
          }"
        >
          {{ u.label }}
          (Lv {{ levelOf(u.type) }})
          – {{ costOf(u.type) }} Fish
        </button>
      </div>

      <p v-if="store.error" style="color:red;margin-top:12px;">
        {{ store.error }}
      </p>
    </div>
  </main>
</template>
