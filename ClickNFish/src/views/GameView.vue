<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useFisherStore } from "@/stores/fisherStore";
import type { Fisher, UpgradeType } from "@/types";
import router from '@/router'

const props = defineProps<{ fisherId: number }>();
const store = useFisherStore();

let passiveInterval: number | undefined;

onMounted(async () => {
  await store.loadFisher(props.fisherId);

  // ➤ Passive Tick alle 1 Sekunde
  passiveInterval = setInterval(async () => {
    await store.passiveTick();
  }, 1000);
});


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
const progressPercent = computed(() => {
  const p = fisher.value?.fishProgress ?? 0;
  const max = 10; // based on backend logic
  return Math.min(100, Math.max(0, (p / max) * 100));
});

onUnmounted(() => {
  if (passiveInterval) clearInterval(passiveInterval);
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

      <!-- Progress bar -->
      <div style="margin-top:10px;">
        <div style="font-size:14px;margin-bottom:4px;">
          Progress: {{ fisher.fishProgress }}/10
        </div>
        <div style="height:12px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
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


      <button
        @click="router.push(`/`)"
        style="padding:12px 18px;font-size:18px;border-radius:10px;border:none;background:#22c55e;color:white;"
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
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
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
