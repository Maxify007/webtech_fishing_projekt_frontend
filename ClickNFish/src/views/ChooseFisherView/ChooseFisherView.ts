import { ref, onMounted, computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useFisherStore } from "@/stores/fisherStore";

import PixelButton from "@/components/PixelButton.vue";
import PixelFrame from "@/components/PixelFrame.vue";
import Board from "@/components/Board.vue";

export default defineComponent({
  components: {
    PixelButton,
    PixelFrame,
    Board,
  },
  setup() {
    const store = useFisherStore();
    const router = useRouter();

    const newName = ref("");
    const creating = ref(false);

    const MAX_FISHERS = 4;
    const canCreateFisher = computed(() => store.fishers.length < MAX_FISHERS);

    onMounted(() => {
      store.loadFishers();
    });

    async function createFisher() {
      if (!newName.value.trim() || creating.value || !canCreateFisher.value) return;

      creating.value = true;
      try {
        await store.createFisher(newName.value.trim());
        newName.value = "";
      } finally {
        creating.value = false;
      }
    }

    return {
      store,
      router,
      newName,
      creating,
      canCreateFisher,
      createFisher,
    };
  },
});
