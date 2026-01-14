import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useFisherStore } from "@/stores/fisherStore";
import { useRouter } from "vue-router";
import type { Fisher, UpgradeType } from "@/types";
import PixelButton from "@/components/PixelButton.vue";
import PixelBar from "@/components/PixelBar.vue";

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
    });

    onUnmounted(() => {
      stopTimer();
    });

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
    };
  },
});

