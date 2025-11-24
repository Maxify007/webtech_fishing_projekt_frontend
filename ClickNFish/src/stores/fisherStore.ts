import { defineStore } from "pinia";
import * as api from "@/services/api";
import type { Fisher, UpgradeType } from "@/types";
import axios from 'axios'

interface FisherState {
  playerId: number;
  fishers: Fisher[];
  activeFisher: Fisher | null;
  loading: boolean;
  error: string | null;
}

export const useFisherStore = defineStore("fisher", {
  state: (): FisherState => ({
    playerId: 1,
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
      try {
        const res = await fetch(`/api/game/${this.activeFisher?.fisherId}/passive`, {
          method: "POST",
        });

        if (!res.ok) throw new Error("Passive tick failed");

        const data = await res.json();
        this.activeFisher = data;

      } catch (err: unknown) {
        if (err instanceof Error) {
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
