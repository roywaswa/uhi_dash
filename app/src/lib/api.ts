import type { ScatterPoint, Stats, TileUrls } from "@/types/uhi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export async function fetchTiles(
  city: string,
  signal?: AbortSignal,
): Promise<TileUrls> {
  const res = await fetch(`${BASE}/tiles/${city}`, { signal });
  if (!res.ok) throw new Error(`Tiles fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchStats(
  city: string,
  signal?: AbortSignal,
): Promise<Stats> {
  const res = await fetch(`${BASE}/stats/${city}`, { signal });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchScatter(
  city: string,
  signal?: AbortSignal,
): Promise<ScatterPoint[]> {
  const res = await fetch(`${BASE}/scatter/${city}`, { signal });
  if (!res.ok) throw new Error(`Scatter fetch failed: ${res.status}`);
  return res.json();
}
