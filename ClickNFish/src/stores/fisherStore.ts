import { defineStore } from "pinia";
import * as api from "@/services/api";
import type { Fisher, UpgradeType } from "@/types";
import axios from "axios";

function getOrCreatePlayerId(): number {
  const stored = localStorage.getItem("playerId");
  if (stored) return Number(stored);

  // Generate a random ID between 1 and 1,000,000,000 (well below 2,147,483,647)
  const max = 1_000_000_000;
  const newId = Math.floor(Math.random() * (max - 1)) + 1;

  localStorage.setItem("playerId", String(newId));
  return newId;
}


interface FisherState {
  playerId: number;
  fishers: Fisher[];
  activeFisher: Fisher | null;
  loading: boolean;
  error: string | null;
}

export const useFisherStore = defineStore("fisher", {
  state: (): FisherState => ({
    playerId: getOrCreatePlayerId(), // ← HERE
    fishers: [],
    activeFisher: null,
    loading: false,
    error: null,
  }),

  actions: {
    async loadFishers() {
      this.loading = true;
      this.error = null;
      try {
        this.fishers = await api.listFishers(this.playerId);
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async createFisher(name: string) {
      this.error = null;
      const fisher = await api.createFisher(this.playerId, name);
      this.fishers.push(fisher);
      return fisher;
    },

    async loadFisher(fisherId: number) {
      this.loading = true;
      this.error = null;
      try {
        this.activeFisher = await api.getFisher(fisherId, this.playerId);
        return this.activeFisher;
      } catch (e) {
        this.error = (e as Error).message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async click() {
      if (!this.activeFisher) return;
      this.activeFisher = await api.click(this.activeFisher.fisherId);
    },

    async passiveTick() {
      if (!this.activeFisher) return;

      this.error = null;

      try {
        const updated = await api.passiveTick(this.activeFisher.fisherId);

        if (updated && typeof updated.fisherId === "number") {
          this.activeFisher = updated;
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          this.error =
            (err.response?.data as { message?: string } | undefined)?.message ??
            err.message ??
            "Passive tick failed";
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = "Passive tick failed";
        }
      }
    },

    async buyUpgrade(type: UpgradeType) {
      if (!this.activeFisher) return;

      this.error = null;

      try {
        this.activeFisher = await api.buyUpgrade(
          this.activeFisher.fisherId,
          type
        );
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
          this.error =
            (e.response?.data as { message?: string } | undefined)?.message ??
            e.message ??
            "Upgrade failed";
        } else if (e instanceof Error) {
          this.error = e.message;
        } else {
          this.error = "Upgrade failed";
        }

        throw e;
      }
    },
  },
});
