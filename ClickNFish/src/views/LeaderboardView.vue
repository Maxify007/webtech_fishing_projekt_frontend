<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getLeaderboard, listFishers } from "@/services/api";
import { useFisherStore } from "@/stores/fisherStore";
import type { Fisher } from "@/types";
import { useRouter } from "vue-router";

const router = useRouter();
const store = useFisherStore();

const top10 = ref<Fisher[]>([]);
const myExtraFishers = ref<Fisher[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    const leaderboard = await getLeaderboard();
    top10.value = leaderboard;

    const playerId = store.playerId;
    if (playerId != null) {
      const myFishers = await listFishers(playerId);
      const topIds = new Set(leaderboard.map(f => f.fisherId));
      myExtraFishers.value = myFishers.filter(f => !topIds.has(f.fisherId));
    }
  } catch (e) {
    error.value = "Leaderboard konnte nicht geladen werden.";
  } finally {
    loading.value = false;
  }
});

const isOwnFisher = (f: Fisher) =>
  store.playerId != null && f.playerId === store.playerId;
</script>

<template>
  <main style="max-width:900px;margin:0 auto;padding:24px;">

    <!-- Back button -->
    <button
      @click="router.back()"
      style="
        padding:10px 16px;
        font-size:16px;
        border-radius:10px;
        border:1px solid #cbd5e1;
        background:white;
        margin-bottom:16px;
      "
    >
      ⬅ Back
    </button>

    <h1 style="margin-bottom:16px;">Leaderboard 🏆</h1>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error" style="color:red;margin-bottom:12px;">
      {{ error }}
    </div>

    <template v-else>
      <table
        style="
          width:100%;
          border-collapse:collapse;
          margin-top:16px;
          font-size:14px;
        "
      >
        <thead>
        <tr>
          <th style="text-align:left;padding:8px;">#</th>
          <th style="text-align:left;padding:8px;">Fisher</th>
          <th style="text-align:right;padding:8px;">Total Fish</th>
        </tr>
        </thead>

        <tbody>
        <!-- Top 10 -->
        <tr
          v-for="(f, index) in top10"
          :key="f.fisherId"
          :style="{
              borderTop:'1px solid #e2e8f0',
              background:isOwnFisher(f) ? '#fef9c3' : 'white',
              fontWeight:isOwnFisher(f) ? '600' : '400'
            }"
        >
          <td style="padding:8px;">{{ index + 1 }}</td>
          <td style="padding:8px;">
            {{ f.name }}
            <span
              v-if="isOwnFisher(f)"
              style="font-size:12px;color:#92400e;"
            >
                (you)
              </span>
          </td>
          <td style="padding:8px;text-align:right;">
            {{ f.totalFishAmount.toLocaleString() }}
          </td>
        </tr>

        <!-- own fishers not in top 10 -->
        <tr v-if="myExtraFishers.length">
          <td colspan="3" style="padding:16px 8px;">
            <hr style="border:none;border-top:1px dashed #cbd5e1;" />
            <div style="margin-top:8px;color:#64748b;font-size:13px;">
              Your fishers (not in Top 10)
            </div>
          </td>
        </tr>

        <tr
          v-for="f in myExtraFishers"
          :key="f.fisherId"
          style="border-top:1px solid #e2e8f0;background:#f8fafc;"
        >
          <td style="padding:8px;">–</td>
          <td style="padding:8px;">
            {{ f.name }}
            <span style="font-size:12px;color:#64748b;">(your fisher)</span>
          </td>
          <td style="padding:8px;text-align:right;">
            {{ f.totalFishAmount.toLocaleString() }}
          </td>
        </tr>
        </tbody>
      </table>
    </template>

  </main>
</template>
