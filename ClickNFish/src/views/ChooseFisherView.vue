<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useFisherStore } from "@/stores/fisherStore";
import PixelButton from "@/components/PixelButton.vue";
import PixelFrame from "@/components/PixelFrame.vue";

const store = useFisherStore();
const router = useRouter();

const newName = ref("");
const creating = ref(false);

const MAX_FISHERS = 3;
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
</script>

<template>
  <main class="page">
    <!-- Header -->
    <div class="header">
      <PixelButton @click="router.push('/leaderboard')">
        🏆 Leaderboard
      </PixelButton>
    </div>

    <h1 class="h1">Choose your Fisher</h1>

    <div v-if="store.loading">Loading...</div>

    <p v-if="store.error" class="error">
      {{ store.error }}
    </p>

    <!-- GRID: Fishers + Create Slot -->
    <section class="grid">
      <!-- Existing Fishers -->
      <PixelFrame
        v-for="f in store.fishers"
        :key="f.fisherId"
        :scale="0.32"
      >
        <div class="frameContent">
          <div class="name">{{ f.name }}</div>
          <div class="fish">Fish: {{ f.fishAmount }}</div>

          <PixelButton size="small" @click="router.push(`/game/${f.fisherId}`)">
            ▶ Play
          </PixelButton>

          <PixelButton
            size="small"
            @click="store.deleteFisher(f.fisherId)"
            :disabled="store.loading"
          >
            🗑 Delete
          </PixelButton>
        </div>
      </PixelFrame>

      <!-- CREATE FISHER SLOT -->
      <PixelFrame
        v-if="canCreateFisher"
        :scale="0.32"
      >
        <div class="frameContent">
          <div class="name">Create Fisher</div>

          <input
            v-model="newName"
            placeholder="Fisher Name"
            class="input"
            :disabled="creating"
          />

          <PixelButton
            size="small"
            :disabled="creating || !newName.trim()"
            @click="createFisher"
          >
            {{ creating ? "Creating..." : "Create" }}
          </PixelButton>
        </div>
      </PixelFrame>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  scrollbar-gutter: stable;
}

.header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.h1 {
  margin: 0 0 16px 0;
}

.error {
  color: red;
  margin-top: 8px;
}

/* Unified grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
  margin-top: 12px;
}

/* Shared centered content */
.frameContent {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 8px;
  text-align: center;

  /* offset */
  transform: translateY(10px);
}


.name {
  font-size: 17px;
  font-weight: bold;
}

.fish {
  font-size: 13px;
  opacity: 0.9;
}

/* Input inside frame */
.input {
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  color: inherit;
  outline: none;
  min-width: 180px;
  text-align: center;
}

.input:disabled {
  opacity: 0.6;
}
</style>
