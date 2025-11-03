<!-- src/components/Game.vue -->
<script setup lang="ts">
import { useGameStore } from '@/stores/game'
const game = useGameStore()

function fishClick() {
  game.clickFish()
}
function buyClickUpgrade() {
  game.buyClickUpgrade()
}
</script>

<template>
  <header>
    <h1>Klick den Fish 🐟</h1>
    <h2>Fische: {{ game.fishCount }}</h2>

    <img
      alt="Fish"
      class="fish-logo"
      src="@/assets/fish.png"
      width="200"
      height="200"
      @click="fishClick"
    />

    <div class="upgrade-area">
      <button class="upgrade-btn" @click="buyClickUpgrade" :disabled="game.fishCount < game.upgradeCost">
        🔼 Upgrade kaufen (x2/Klick, kostet {{ game.upgradeCost }} 🐟)
      </button>
    </div>
  </header>
</template>

<style scoped>
.fish-logo { cursor: pointer; transition: transform .1s ease; }
.fish-logo:active { transform: scale(0.95); }
.upgrade-area { margin-top: 1rem; }
.upgrade-btn {
  padding: .6rem 1.2rem; border: none; border-radius: .5rem;
  background: #4ade80; cursor: pointer;
}
.upgrade-btn:disabled { background: #9ca3af; cursor: not-allowed; }
</style>
