import { defineComponent, ref, onMounted } from "vue";
import { getLeaderboard } from "@/services/api";
import type { Fisher } from "@/types";
import { useRouter } from "vue-router";
import PixelButton from "@/components/PixelButton.vue";
import PixelFrame from "@/components/PixelFrame.vue";

export default defineComponent({
  name: "LeaderboardView",
  components: { PixelButton, PixelFrame },
  setup() {
    const router = useRouter();

    const top10 = ref<Fisher[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    onMounted(async () => {
      loading.value = true;
      error.value = null;

      try {
        top10.value = (await getLeaderboard()).slice(0, 10);

      } catch {
        error.value = "Leaderboard konnte nicht geladen werden.";
      } finally {
        loading.value = false;
      }
    });

    function frameVariant(index: number) {
      if (index === 0) return "gold";
      if (index === 1) return "silver";
      if (index === 2) return "bronze";
      return undefined;
    }

    return {
      router,
      top10,
      loading,
      error,
      frameVariant,
    };
  },
});

