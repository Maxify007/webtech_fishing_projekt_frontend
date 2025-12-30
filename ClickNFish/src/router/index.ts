import { createRouter, createWebHistory } from "vue-router";
import ChooseFisherView from "@/views/ChooseFisherView.vue";
import GameView from "@/views/GameView.vue";
import LeaderboardView from "@/views/LeaderboardView.vue";
import FisherStatsView from "@/views/FisherStatsView.vue";
export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: ChooseFisherView },
    {
      path: "/stats/:fisherId",
      name: "fisher-stats",
      component: FisherStatsView,
      props: true,
    },
    {
      path: "/game/:fisherId",
      component: GameView,
      props: route => ({ fisherId: Number(route.params.fisherId) })

    },
    {
      path: "/leaderboard",
      component: LeaderboardView
    }

  ]
});
