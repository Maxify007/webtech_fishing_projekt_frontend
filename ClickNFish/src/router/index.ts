import { createRouter, createWebHistory } from "vue-router";
import ChooseFisherView from "@/views/ChooseFisherView.vue";
import GameView from "@/views/GameView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: ChooseFisherView },
    {
      path: "/game/:fisherId",
      component: GameView,
      props: route => ({ fisherId: Number(route.params.fisherId) })
    }
  ]
});
