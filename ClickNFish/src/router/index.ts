// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Game from '@/components/Game.vue'
import StatsView from '@/views/StatsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/game' },              // <-- Umleitung
    { path: '/game', name: 'game', component: Game },
    { path: '/stats', name: 'stats', component: StatsView }
  ]
})

export default router
