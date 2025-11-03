<!-- src/App.vue -->
<script setup lang="ts"></script>

<template>
  <nav class="nav">
    <router-link to="/game">🎣 Game</router-link>
    <router-link to="/stats">📈 Stats</router-link>
  </nav>
  <router-view />
</template>

<style scoped>
.nav { display:flex; gap:1rem; padding:1rem; }
</style>
