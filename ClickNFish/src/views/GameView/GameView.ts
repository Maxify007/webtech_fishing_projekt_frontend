import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useFisherStore } from "@/stores/fisherStore";
import { useRouter } from "vue-router";
import type { Fisher, UpgradeType } from "@/types";
import PixelButton from "@/components/PixelButton.vue";
import PixelBar from "@/components/PixelBar.vue";
import fishImg from "@/assets/fish.png"; // added: fish asset

export default defineComponent({
  name: "GameView",
  components: { PixelButton, PixelBar },
  props: {
    fisherId: { type: Number, required: true },
  },
  setup(props) {
    const router = useRouter();
    const store = useFisherStore();

    const timeNow = ref(Date.now());
    const isInitialLoading = ref(true);

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
      const f = fisher.value;
      if (!f) return 1;
      const levels = f.upgradeLevels;
      if (levels && typeof levels[type] === "number") {
        return levels[type] as number;
      }
      return 1;
    }

    function costOf(type: UpgradeType): number {
      const level = levelOf(type);
      const rounded = Math.round(Math.pow(1.15, level) * 10);
      return rounded;
    }

    async function buy(type: UpgradeType) {
      await store.buyUpgrade(type);
    }

    const progressPercent = computed(() => {
      const p = fisher.value?.fishProgress ?? 0;
      const max = 10;
      return Math.min(100, Math.max(0, (p / max) * 100));
    });

    const nextAutoMs = ref<number | null>(null);
    const nextAutoSeconds = computed(() => {
      if (nextAutoMs.value == null) return null;
      return Math.ceil(nextAutoMs.value / 1000);
    });

    const autoProgress = computed(() => {
      const f = fisher.value;
      if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
        return 0;
      }
      const tickDuration = f.passiveFishSpeedMultiplier;
      const last = f.lastPassiveTickMillis;
      const elapsed = timeNow.value - last;
      const ratio = Math.max(0, Math.min(1, elapsed / tickDuration));
      return ratio * 100;
    });

    // ---- particles system ----
    interface Particle {
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      lifetime: number;
      opacity: number;
      emoji: string;
      fontSize: number;
      angle: number;
      src?: string;    // added: image source
      size?: number;   // added: rendered size in px
    }

    const particles = ref<Particle[]>([]);
    const particlesRoot = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    let particleId = 1;
    let rafHandle: number | null = null;
    let lastFrame = performance.now();

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function spawnFishParticles(count = 12) {
      // compute spawn origin (try to use the fish-count element)
      let originX = window.innerWidth / 2;
      let originY = window.innerHeight / 2;
      const fishEl = document.querySelector(".fish-count");
      const rootEl = contentRef.value ?? document.querySelector(".content");
      if (fishEl && rootEl) {
        const fishRect = (fishEl as HTMLElement).getBoundingClientRect();
        const rootRect = (rootEl as HTMLElement).getBoundingClientRect();
        originX = fishRect.left + fishRect.width / 2 - rootRect.left;
        originY = fishRect.top + fishRect.height / 2 - rootRect.top;
      } else if (rootEl) {
        const rootRect = (rootEl as HTMLElement).getBoundingClientRect();
        originX = rootRect.width / 2;
        originY = rootRect.height / 3;
      }

      for (let i = 0; i < count; i++) {
        const angle = rand(-60, 60);
        const speed = rand(140, 420);
        const rad = (angle * Math.PI) / 180;
        const vx = Math.cos(rad) * speed * rand(0.5, 1.0);
        const vy = -Math.abs(Math.sin(rad) * speed) * rand(0.5, 1.0); // upwards initially

        particles.value.push({
          id: particleId++,
          x: originX + rand(-24, 24),
          y: originY + rand(-12, 12),
          vx,
          vy,
          life: 1.0 + Math.random() * 0.8,
          lifetime: 1.0 + Math.random() * 0.8,
          opacity: 1,
          emoji: "🐟",
          fontSize: Math.round(rand(16, 28)),
          angle: rand(-45, 45),
          src: fishImg,           // use fish asset
          size: Math.round(rand(18, 36)) // rendered pixel size
        });
      }
    }

    function tick(now = performance.now()) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000); // clamp dt
      lastFrame = now;

      const g = 1000; // gravity px/s^2 (tweak)
      for (const p of particles.value) {
        p.vy += g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.opacity = Math.max(0, p.life / p.lifetime);
        p.angle += dt * 200 * (p.vx < 0 ? -1 : 1) * 0.02;
      }

      // prune dead
      particles.value = particles.value.filter((p) => p.life > 0);

      // schedule next frame only if there are particles
      if (particles.value.length > 0) {
        rafHandle = requestAnimationFrame(tick);
      } else {
        // no particles -> stop loop
        rafHandle = null;
      }
    }

    function startParticlesLoop() {
      if (rafHandle === null && particles.value.length > 0) {
        lastFrame = performance.now();
        rafHandle = requestAnimationFrame(tick);
      }
    }
    function stopParticlesLoop() {
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
    }

    // spawn when progress resets to 0 (detect crossing from >0 to 0)
    watch(
      () => fisher.value?.fishProgress,
      async (newVal, oldVal) => {
        const n = Number(newVal ?? 0);
        const o = Number(oldVal ?? 0);
        if (n === 0 && o > 0) {
          // ensure DOM ready for bounds calculation
          await nextTick();
          spawnFishParticles(18);
          startParticlesLoop();
        }
      }
    );

    // ---- existing lifecycle hooks ----
    let timerInterval: number | null = null;

    function updateCountdownOnly() {
      const f = fisher.value;
      if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
        nextAutoMs.value = null;
        return;
      }
      const tickDuration = f.passiveFishSpeedMultiplier;
      const last = f.lastPassiveTickMillis;
      const now = Date.now();
      const elapsed = now - last;
      const clamped = Math.max(0, Math.min(tickDuration, elapsed));
      const remaining = tickDuration - clamped;
      nextAutoMs.value = Math.max(0, Math.round(remaining));
    }

    async function checkAndDoPassiveTick() {
      const f = fisher.value;
      if (!f || !f.passiveFishSpeedMultiplier || !f.lastPassiveTickMillis) {
        updateCountdownOnly();
        return;
      }

      const tickDuration = f.passiveFishSpeedMultiplier;
      const last = f.lastPassiveTickMillis;
      const now = Date.now();
      const elapsed = now - last;

      if (elapsed >= tickDuration) {
        await store.passiveTick();
      }

      updateCountdownOnly();
    }

    function startTimer() {
      stopTimer();
      updateCountdownOnly();

      timerInterval = window.setInterval(() => {
        timeNow.value = Date.now();
        void checkAndDoPassiveTick();
      }, 1000);
    }

    function stopTimer() {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    onMounted(async () => {
      await store.loadFisher(props.fisherId);
      isInitialLoading.value = false;
      startTimer();
      // contentRef will be populated by template ref
    });

    onUnmounted(() => {
      stopTimer();
      stopParticlesLoop();
    });

    // ---- return bindings (include new refs and fishImg) ----
    return {
      router,
      store,
      timeNow,
      fisher,
      isInitialLoading,
      fmt,
      upgradeButtons,
      levelOf,
      costOf,
      buy,
      progressPercent,
      nextAutoSeconds,
      autoProgress,
      fisherId: props.fisherId,
      // particles system
      particles,
      particlesRoot,
      contentRef,
      fishImg, // expose asset to template
    };
  },
});
