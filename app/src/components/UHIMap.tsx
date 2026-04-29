"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ActiveLayer, CityKey, TileUrls } from "@/types/uhi";

interface Props {
  city: CityKey;
  tiles: TileUrls | null;
  activeLayer: ActiveLayer;
  center: [number, number];
  zoom: number;
}

const LAYERS: ActiveLayer[] = ["lst", "ndvi", "vulnerability"];

function rasterId(layer: ActiveLayer): string {
  return `uhi-${layer}`;
}

export default function UHIMap({
  city,
  tiles,
  activeLayer,
  center,
  zoom,
}: Props): React.JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center,
      zoom,
    });
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center, zoom, duration: 600 });
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tiles) return;

    const addSources = () => {
      for (const layer of LAYERS) {
        const id = rasterId(layer);
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
        if (map.getSource(id)) {
          map.removeSource(id);
        }
      }

      for (const layer of LAYERS) {
        const id = rasterId(layer);
        map.addSource(id, {
          type: "raster",
          tiles: [tiles[layer]],
          tileSize: 256,
        });
        map.addLayer({
          id,
          type: "raster",
          source: id,
          layout: {
            visibility: layer === activeLayer ? "visible" : "none",
          },
          paint: {
            "raster-opacity": 0.82,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      addSources();
      return;
    }

    map.once("load", addSources);
    return () => {
      map.off("load", addSources);
    };
  }, [tiles, activeLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const layer of LAYERS) {
      const id = rasterId(layer);
      if (map.getLayer(id)) {
        map.setLayoutProperty(
          id,
          "visibility",
          layer === activeLayer ? "visible" : "none",
        );
      }
    }
  }, [activeLayer]);

  return (
    <section
      ref={containerRef}
      className="h-full w-full"
      aria-label={`${city} heat island map`}
    />
  );
}
