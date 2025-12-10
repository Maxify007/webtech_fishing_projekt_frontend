import type { Fisher, UpgradeType } from "@/types";
import { http } from "./http";

export async function listFishers(playerId: number): Promise<Fisher[]> {
  const { data } = await http.get<Fisher[]>("/fishers", {
    params: { playerId },
  });
  return data;
}

export async function createFisher(
  playerId: number,
  name: string
): Promise<Fisher> {
  const { data } = await http.post<Fisher>("/fishers", { playerId, name });
  return data;
}

export async function getFisher(
  fisherId: number,
  playerId: number
): Promise<Fisher> {
  const { data } = await http.get<Fisher>(`/fishers/${fisherId}`, {
    params: { playerId },
  });
  return data;
}

export async function click(fisherId: number): Promise<Fisher> {
  const { data } = await http.post<Fisher>(`/game/${fisherId}/click`);
  return data;
}
export async function getLeaderboard(): Promise<Fisher[]> {
  const { data } = await http.get<Fisher[]>("/leaderboard");
  return data;
}
export async function deleteFisher(fisherId: number, playerId: number): Promise<void> {
  await http.delete(`/fishers/${fisherId}`, {
    params: { playerId }
  });
}
export async function buyUpgrade(
  fisherId: number,
  type: UpgradeType
): Promise<Fisher> {
  const { data } = await http.post<Fisher>(
    `/game/${fisherId}/upgrade/${type}`
  );
  return data;
}
export async function passiveTick(fisherId: number): Promise<Fisher> {
  const { data } = await http.post<Fisher>(`/game/${fisherId}/passive`);
  return data;
}
