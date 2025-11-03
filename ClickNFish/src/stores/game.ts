import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    fishCount: 0,
    fishClickValue: 1,
    upgradeCost: 10,
  }),
  actions: {
    clickFish() {
      this.fishCount += this.fishClickValue
    },
    buyClickUpgrade() {
      if (this.fishCount >= this.upgradeCost) {
        this.fishCount -= this.upgradeCost
        this.fishClickValue *= 2
        this.upgradeCost *= 2
      } else {
        alert('Nicht genug Fische!')
      }
    },
  },
})
