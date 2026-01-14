import { defineComponent, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFisherStore } from "@/stores/fisherStore";
import type { Fisher } from "@/types";
import PixelButton from "@/components/PixelButton.vue";

export default defineComponent({
  components: { PixelButton },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useFisherStore();

    const fisherId = Number(route.params.fisherId);
    const isLoading = ref(true);

    const fisher = computed(() => store.activeFisher as Fisher | null);

    const fmt = (n: unknown, digits = 2) =>
      typeof n === "number" && Number.isFinite(n) ? n.toFixed(digits) : "0.00";

    onMounted(async () => {
      await store.loadFisher(fisherId);
      isLoading.value = false;
    });

    return {
      router,
      store,
      isLoading,
      fisher,
      fmt,
    };
  },
});

