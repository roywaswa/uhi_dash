"use client";
import { useState, useEffect } from "react";
import UHIMap from "@/components/UHIMap";
import StatsPanel from "@/components/StatsPanel";
import ScatterChart from "@/components/ScatterChart";
import LayerToggle from "@/components/LayerToggle";
import { fetchTiles, fetchStats, fetchScatter } from "@/lib/api";
import type { CityKey, TileUrls, Stats, ScatterPoint, ActiveLayer } from "@/types/uhi";

const CITY_META: Record<CityKey, { center: [number, number]; zoom: number }> = {
  Nairobi: { center: [36.82, -1.29], zoom: 11 },
  Phoenix: { center: [-112.07, 33.45], zoom: 11 },
  Delhi: { center: [77.1, 28.7], zoom: 11 },
};

export default function Home() {
  const [city, setCity] = useState<CityKey>("Nairobi");
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("lst");
  const [tiles, setTiles] = useState<TileUrls | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scatter, setScatter] = useState<ScatterPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([fetchTiles(city), fetchStats(city), fetchScatter(city)])
      .then(([tilesData, statsData, scatterData]) => {
        if (!abortController.signal.aborted) {
          setTiles(tilesData);
          setStats(statsData);
          setScatter(scatterData);
        }
      })
      .catch((err) => {
        if (!abortController.signal.aborted) {
          setError(err.message || "Failed to load data");
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [city]);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              URBAN HEAT ISLAND
            </h1>
            <div className="flex gap-2">
              {(["Nairobi", "Phoenix", "Delhi"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-3 py-1 text-xs uppercase font-semibold border transition-colors ${
                    city === c
                      ? "bg-accent text-black border-accent"
                      : "border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-400 font-mono">
              Error: {error}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 flex flex-col">
          <UHIMap
            city={city}
            tiles={tiles}
            activeLayer={activeLayer}
            center={CITY_META[city].center}
            zoom={CITY_META[city].zoom}
          />
        </div>

        {/* Right sidebar */}
        <aside className="w-80 border-l flex flex-col overflow-y-auto" style={{ borderColor: "var(--border)" }}>
          <div className="p-6 space-y-6 flex-1">
            {/* Layer Toggle */}
            <LayerToggle active={activeLayer} onChange={setActiveLayer} />

            {/* Stats Panel */}
            <StatsPanel stats={stats} loading={loading} city={city} />

            {/* Scatter Chart */}
            <ScatterChart data={scatter} loading={loading} city={city} />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t px-6 py-3 text-xs text-gray-500 font-mono" style={{ borderColor: "var(--border)" }}>
        Data: Landsat 8/9 Collection 2 (Jun–Sep 2023) | LST & NDVI Analysis via Google Earth Engine
      </footer>
    </div>
  );
}
