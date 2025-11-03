<!-- src/views/StatsView.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import FisherStats from '@/components/FisherStats.vue'

const game = useGameStore()

const fisher = computed(() => ({
  id: 1,
  name: 'Cap’n Nemo',
  fishAmount: game.fishCount,
  upgrades: [],
  luckRate: 0,
  luckMultiplier: 1.0,
  fishSpeedMultiplier: 1,
  fishPerPull: game.fishClickValue,
  masteryScore: 0,
}))
</script>

<template>
  <main class="page">
    <FisherStats :fisher="fisher" />
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;

  background: #0b1220;
  color: #ffffff;
}

:deep(.card) {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

:deep(.row) {
  background: #273449;
}

:deep(.upgrade) {
  background: #334155;
  border: 1px solid #475569;
}
</style>
