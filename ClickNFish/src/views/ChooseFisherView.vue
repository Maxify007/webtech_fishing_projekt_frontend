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
    <h1>Choose your Fisher</h1>

    <div v-if="store.loading">Loading...</div>
    <div v-if="store.error" style="color:red">{{ store.error }}</div>

    <section
      v-if="store.fishers.length"
      style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:12px;"
    >
      <button
        v-for="f in store.fishers"
        :key="f.fisherId"
        @click="router.push(`/game/${f.fisherId}`)"
        style="padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:white;text-align:left;"
      >
        <b>{{ f.name }}</b>
        <div>Fish: {{ f.fishAmount }}</div>
      </button>
    </section>

    <h2 style="margin-top:32px;">Create a Fisher</h2>

    <form @submit.prevent="createFisher">
      <input v-model="newName" placeholder="Name" />
      <button type="submit" :disabled="creating">
        {{ creating ? "Creating..." : "Create" }}
      </button>
    </form>
  </main>
</template>
