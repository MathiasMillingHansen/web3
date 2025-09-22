import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/home/Home.vue';
import Game from '../pages/game/Game.vue';
import Setup from '../pages/setup/Setup.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/game', component: Game },
  { path: '/setup', component: Setup}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;