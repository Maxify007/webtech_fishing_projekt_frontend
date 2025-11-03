<!-- src/views/StatsView.vue -->
<template>
  <main class="page">
    <FisherStats :fisher="fisher" />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FisherStats from '@/components/FisherStats.vue'

type Upgrade = { id: number|string; name: string; level?: number; description?: string }
type Fisher = {
  id: number
  name: string
  fishAmount: number
  upgrades: Upgrade[]
  luckRate: number
  luckMultiplier: number
  fishSpeedMultiplier: number
  fishPerPull: number
  masteryScore: number
}

// Dummy-Daten für die Anzeige (später durch API ersetzen)
const fisher = ref<Fisher>({
  id: 1,
  name: 'Cap’n Nemo',
  fishAmount: 123,
  upgrades: [
    { id: 'rod', name: 'Holzrute', level: 2, description: '+1/Klick' },
    { id: 'net', name: 'Kleines Netz', level: 1, description: '+0.2/s' }
  ],
  luckRate: 5,
  luckMultiplier: 2.0,
  fishSpeedMultiplier: 1,
  fishPerPull: 3,
  masteryScore: 42
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;

  /* Dunkler Hintergrund + heller Text */
  background: #0b1220;
  color: #ffffff;
}

/* Karte in dunklem Look */
:deep(.card) {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

/* Reihen leicht absetzen */
:deep(.row) {
  background: #273449;
}

/* Upgrade-Kacheln */
:deep(.upgrade) {
  background: #334155;
  border: 1px solid #475569;
}
</style>
