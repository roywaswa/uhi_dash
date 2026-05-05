import type { ScatterPoint, Stats, TileUrls } from "@/types/uhi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export async function fetchTiles(
  city: string,
  year: number = 2023,
  signal?: AbortSignal,
): Promise<TileUrls> {
  const res = await fetch(`${BASE}/tiles/${city}?year=${year}`, { signal });
  if (!res.ok) throw new Error(`Tiles fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchStats(
  city: string,
  year: number = 2023,
  signal?: AbortSignal,
): Promise<Stats> {
  const res = await fetch(`${BASE}/stats/${city}?year=${year}`, { signal });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchScatter(
  city: string,
  year: number = 2023,
  signal?: AbortSignal,
): Promise<ScatterPoint[]> {
  const res = await fetch(`${BASE}/scatter/${city}?year=${year}`, { signal });
  if (!res.ok) throw new Error(`Scatter fetch failed: ${res.status}`);
  return res.json();
}
