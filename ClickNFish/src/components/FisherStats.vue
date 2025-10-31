<!-- src/components/FisherStats.vue -->
<script setup lang="ts">
type Upgrade = { id: number | string; name: string; level?: number; description?: string }
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

const props = defineProps<{ fisher: Fisher }>()

// Schlüssel-Werte für v-for (Stats)
const statEntries = [
  { key: 'fishAmount', label: 'Fische gesamt', value: props.fisher.fishAmount },
  { key: 'fishPerPull', label: 'Fische pro Klick', value: props.fisher.fishPerPull },
  { key: 'fishSpeedMultiplier', label: 'Geschwindigkeit x', value: props.fisher.fishSpeedMultiplier },
  { key: 'luckRate', label: 'Glücksrate %', value: props.fisher.luckRate },
  { key: 'luckMultiplier', label: 'Glück x', value: props.fisher.luckMultiplier },
  { key: 'masteryScore', label: 'Mastery-Score', value: props.fisher.masteryScore }
]
</script>

<template>
  <section class="card">
    <header class="head">
      <h2>Fisher-Stats</h2>
      <div class="meta">
        <span class="label">ID:</span><span>{{ fisher.id }}</span>
        <span class="label">Name:</span><span>{{ fisher.name }}</span>
      </div>
    </header>

    <!-- v-for #1: Stat-Paare -->
    <ul class="stats">
      <li v-for="s in statEntries" :key="s.key" class="row">
        <span class="key">{{ s.label }}</span>
        <span class="val">{{ s.value }}</span>
      </li>
    </ul>

    <!-- v-for #2: Upgrades -->
    <div v-if="fisher.upgrades?.length" class="upgrades">
      <h3>Upgrades ({{ fisher.upgrades.length }})</h3>
      <ul>
        <li v-for="u in fisher.upgrades" :key="u.id" class="upgrade">
          <strong>{{ u.name }}</strong>
          <small v-if="u.level !== undefined"> (Level {{ u.level }})</small>
          <div class="desc" v-if="u.description">{{ u.description }}</div>
        </li>
      </ul>
    </div>
    <div v-else class="empty">Keine Upgrades vorhanden.</div>
  </section>
</template>

<style scoped>
.card { border:1px solid #0b1220; border-radius:.75rem; padding:1rem; background:#fff; max-width:720px; }
.head { display:flex; justify-content:space-between; align-items:baseline; gap:1rem; margin-bottom:.5rem; }
.meta { display:grid; grid-template-columns:auto 1fr; gap:.25rem .5rem; }
.label { opacity:.7; }
.stats { list-style:none; padding:0; margin:.5rem 0 1rem; display:grid; gap:.4rem; }
.row { display:flex; justify-content:space-between; padding:.5rem .75rem; background:#0b1220; border-radius:.5rem; }
.key { opacity:.75; }
.val { font-weight:600; }
.upgrades ul { list-style:none; padding:0; margin:.25rem 0 0; display:grid; gap:.3rem; }
.upgrade { padding:.4rem .6rem; background:#0b1220; border:1px solid #eee; border-radius:.4rem; }
.desc { opacity:.8; font-size:.9rem; }
.empty { opacity:.7; font-style:italic; }
</style>
