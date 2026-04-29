"use client";

import { useEffect, useState } from "react";
import LayerToggle from "@/components/LayerToggle";
import ScatterChart from "@/components/ScatterChart";
import StatsPanel from "@/components/StatsPanel";
import UHIMap from "@/components/UHIMap";
import { fetchScatter, fetchStats, fetchTiles } from "@/lib/api";
import type {
  ActiveLayer,
  CityKey,
  ScatterPoint,
  Stats,
  TileUrls,
} from "@/types/uhi";

const CITY_META: Record<CityKey, { center: [number, number]; zoom: number }> = {
  Nairobi: { center: [36.82, -1.29], zoom: 11 },
  Phoenix: { center: [-112.07, 33.45], zoom: 11 },
  Delhi: { center: [77.1, 28.7], zoom: 11 },
};

const CITIES = Object.keys(CITY_META) as CityKey[];

export default function Home(): React.JSX.Element {
  const [city, setCity] = useState<CityKey>("Nairobi");
  const [tiles, setTiles] = useState<TileUrls | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scatter, setScatter] = useState<ScatterPoint[]>([]);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("lst");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCity(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [nextTiles, nextStats, nextScatter] = await Promise.all([
          fetchTiles(city, controller.signal),
          fetchStats(city, controller.signal),
          fetchScatter(city, controller.signal),
        ]);

        setTiles(nextTiles);
        setStats(nextStats);
        setScatter(nextScatter);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setTiles(null);
        setStats(null);
        setScatter([]);
        setError(
          err instanceof Error ? err.message : "Unable to load UHI data",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCity();

    return () => {
      controller.abort();
    };
  }, [city]);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0a] text-[#e8e8e8]">
      <header className="border-[#222222] border-b px-5 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-[#666666] text-[10px] uppercase tracking-[0.28em]">
              Landsat 8/9 C2 L2
            </p>
            <h1 className="font-medium text-2xl text-white uppercase tracking-[0.16em] md:text-3xl">
              URBAN HEAT ISLAND
            </h1>
          </div>
          <nav
            className="flex border border-[#222222] bg-[#111111] p-1"
            aria-label="City selector"
          >
            {CITIES.map((nextCity) => (
              <button
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  city === nextCity
                    ? "bg-[#d73027] text-white"
                    : "text-[#888888] hover:bg-[#1b1b1b] hover:text-white"
                }`}
                key={nextCity}
                onClick={() => setCity(nextCity)}
                type="button"
              >
                {nextCity}
              </button>
            ))}
          </nav>
        </div>
        {error ? (
          <p className="mt-3 border-[#d73027] border-l px-3 py-2 text-[#f46d43] text-xs uppercase tracking-[0.12em]">
            {error}
          </p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="min-h-[420px] flex-1 md:min-h-0">
          <UHIMap
            activeLayer={activeLayer}
            center={CITY_META[city].center}
            city={city}
            tiles={tiles}
            zoom={CITY_META[city].zoom}
          />
        </section>

        <aside className="flex min-h-0 w-full flex-col border-[#222222] border-l md:w-[280px]">
          <StatsPanel city={city} loading={loading} stats={stats} />
          <LayerToggle active={activeLayer} onChange={setActiveLayer} />
          <ScatterChart city={city} data={scatter} loading={loading} />
        </aside>
      </div>

      <footer className="border-[#222222] border-t px-5 py-3 text-[#666666] text-[10px] uppercase tracking-[0.16em]">
        Source: Landsat 8/9 Collection 2 Level-2, Jun-Sep 2023. LST, NDVI, and
        vulnerability computed via Google Earth Engine.
      </footer>
    </main>
  );
}
