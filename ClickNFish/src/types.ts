export type UpgradeType =
  | "CLICK_FLAT"
  | "CLICK_LUCK_RATE"
  | "CLICK_LUCK_MULTIPLIER"
  | "CLICK_MASTERY_MULTIPLIER"
  | "PASSIVE_FISH_RATE"
  | "PASSIVE_FISH_AMOUNT";

export interface Upgrade {
  id?: number;
  type: UpgradeType;
  level: number;
}

export interface Fisher {
  fisherId: number;
  playerId: number;
  name: string;

  fishAmount: number;
  baseFishPull: number;
  totalFishAmount: number;
  luckRate: number;
  luckMultiplier: number;
  masteryMultiplier: number;

  passiveFishSpeedMultiplier: number;
  passiveFishPerPull: number;
  lastPassiveTickMillis: number;

  fishProgress: number;
  upgrades: Upgrade[];
}
