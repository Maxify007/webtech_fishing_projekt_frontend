<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useFisherStore } from "@/stores/fisherStore";

const store = useFisherStore();
const router = useRouter();

const newName = ref("");
const creating = ref(false);

onMounted(() => {
  store.loadFishers();
});

async function createFisher() {
  if (!newName.value.trim() || creating.value) return;

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
  <main style="max-width:900px;margin:0 auto;padding:24px;">

    <!-- Header row with right-aligned leaderboard -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
      <button
        @click="router.push('/leaderboard')"
        style="
          padding:10px 16px;
          border-radius:10px;
          border:1px solid #cbd5e1;
          background:white;
          cursor:pointer;
        "
      >
        🏆 Leaderboard
      </button>
    </div>

    <h1 style="margin-bottom:16px;">Choose your Fisher</h1>

    <div v-if="store.loading">Loading...</div>

    <p v-if="store.error" style="color:red;margin-top:8px;">
      {{ store.error }}
    </p>

    <!-- Fisher list -->
    <section
      v-if="store.fishers.length"
      style="
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
    gap:12px;
    margin-top:12px;
  "
    >
      <div
        v-for="f in store.fishers"
        :key="f.fisherId"
        style="
      padding:16px;
      border:1px solid #cbd5e1;
      border-radius:12px;
      background:white;
      text-align:left;
      display:flex;
      flex-direction:column;
      gap:8px;
    "
      >

        <!-- Fisher select button -->
        <button
          @click="router.push(`/game/${f.fisherId}`)"
          style="
        padding:10px 12px;
        border-radius:10px;
        border:none;
        background:#22c55e;
        color:white;
        cursor:pointer;
        width:100%;
      "
        >
          ▶ Play as {{ f.name }}
        </button>

        <div style="font-size:14px;">
          Fish: {{ f.fishAmount }}
        </div>

        <!-- DELETE BUTTON -->
        <button
          @click="store.deleteFisher(f.fisherId)"
          style="
        padding:8px 12px;
        border-radius:10px;
        border:1px solid #ef4444;
        background:white;
        color:#ef4444;
        cursor:pointer;
        width:100%;
      "
        >
          🗑 Delete Fisher
        </button>

      </div>
    </section>


    <!-- Create form -->
    <h2 style="margin-top:32px;">Create a Fisher</h2>

    <form @submit.prevent="createFisher" style="margin-top:12px;">
      <input
        v-model="newName"
        placeholder="Name"
        style="
          padding:10px;
          border:1px solid #cbd5e1;
          border-radius:10px;
          margin-right:8px;
        "
      />
      <button
        type="submit"
        :disabled="creating"
        style="
          padding:10px 16px;
          border-radius:10px;
          border:none;
          background:#22c55e;
          color:white;
          cursor:pointer;
        "
      >
        {{ creating ? "Creating..." : "Create" }}
      </button>
    </form>

  </main>
</template>
