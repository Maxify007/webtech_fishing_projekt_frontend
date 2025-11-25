<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useFisherStore } from "@/stores/fisherStore";
import type { Fisher, UpgradeType } from "@/types";
import router from "@/router";

const props = defineProps<{ fisherId: number }>();
const store = useFisherStore();

const fisher = computed(() => store.activeFisher as Fisher | null);

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

function levelOf(type: UpgradeType): number {
  const up = fisher.value?.upgrades?.find((u) => u.type === type);
  return up?.level ?? 0;
}

async function buy(type: UpgradeType) {
  await store.buyUpgrade(type);
  await store.loadFisher(props.fisherId); // refresh levels + stats
}

// manual click progress bar (already had this)
const progressPercent = computed(() => {
  const p = fisher.value?.fishProgress ?? 0;
  const max = 10;
  return Math.min(100, Math.max(0, (p / max) * 100));
});

/**
 * === AUTO FISH / PASSIVE TIMER ===
 * We use passiveFishSpeedMultiplier as tick duration in ms,
 * and lastPassiveTickMillis from backend to estimate time to next tick.
 */

const nextAutoMs = ref<number | null>(null);

const nextAutoSeconds = computed(() => {
  if (nextAutoMs.value == null) return null;
  return Math.ceil(nextAutoMs.value / 1000);
});

const autoProgress = computed(() => {
  const f = fisher.value;
  if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
    return 0;
  }
  const tickDuration = f.passiveFishSpeedMultiplier;
  const last = f.lastPassiveTickMillis;
  const now = Date.now();
  const elapsed = now - last;
  const ratio = Math.max(0, Math.min(1, (elapsed % tickDuration) / tickDuration));
  return ratio * 100;
});

let countdownInterval: number | null = null;
let passiveInterval: number | null = null;

function updateCountdown() {
  const f = fisher.value;
  if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
    nextAutoMs.value = null;
    return;
  }
  const tickDuration = f.passiveFishSpeedMultiplier;
  const last = f.lastPassiveTickMillis;
  const now = Date.now();
  const elapsed = now - last;
  const remaining = tickDuration - (elapsed % tickDuration);
  nextAutoMs.value = Math.max(0, Math.round(remaining));
}

function startTimers() {
  stopTimers();
  updateCountdown();

  // visual countdown every second
  countdownInterval = window.setInterval(updateCountdown, 1000);

  // call backend passiveTick regularly (e.g. every second)
  passiveInterval = window.setInterval(async () => {
    if (!fisher.value) return;
    await store.passiveTick();
    updateCountdown();
  }, 1000);
}

function stopTimers() {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (passiveInterval !== null) {
    clearInterval(passiveInterval);
    passiveInterval = null;
  }
}

onMounted(async () => {
  await store.loadFisher(props.fisherId);
  startTimers();
});

onUnmounted(() => {
  stopTimers();
});
</script>

<template>
  <main style="max-width:900px;margin:0 auto;padding:24px;">
    <div v-if="!fisher">Loading Fisher...</div>

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

      <button
        @click="router.push(`/`)"
        style="margin-top:16px;padding:12px 18px;font-size:18px;border-radius:10px;border:none;background:#22c55e;color:white;"
      >
        Back
      </button>

      <h2 style="margin-top:20px;">Stats</h2>
      <ul>
        <li>Base Pull: {{ fisher.baseFishPull }}</li>
        <li>Luck Rate: {{ fisher.luckRate ?? 0 }}%</li>
        <li>Luck Multiplier: x{{ fmt(fisher.luckMultiplier) }}</li>
        <li>Mastery Multiplier: x{{ fmt(fisher.masteryMultiplier) }}</li>
        <li>Passive Delay: {{ fmt(fisher.passiveFishSpeedMultiplier, 0) }} ms</li>
        <li>Passive Fish/Tick: {{ fisher.passiveFishPerPull ?? 0 }}</li>
      </ul>

      <h2 style="margin-top:20px;">Upgrades</h2>
      <div
        style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;"
      >
        <button
          v-for="u in upgradeButtons"
          :key="u.type"
          @click="buy(u.type)"
          style="padding:10px;border-radius:8px;border:1px solid #cbd5e1;background:white;"
        >
          {{ u.label }} (Lv {{ levelOf(u.type) }})
        </button>
      </div>

      <p v-if="store.error" style="color:red;margin-top:12px;">
        {{ store.error }}
      </p>
    </div>
  </main>
</template>
