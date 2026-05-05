"use client";

import {
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Scatter } from "react-chartjs-2";
import type { ScatterPoint } from "@/types/uhi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

interface Props {
  data: ScatterPoint[];
  loading: boolean;
  city: string;
}

interface ChartPoint {
  x: number;
  y: number;
}

function getThemeColors() {
  if (typeof document === "undefined") {
    return {
      text: "#e8e8e8",
      textMuted: "#888888",
      border: "#222222",
    };
  }
  
  const root = document.documentElement;
  return {
    text: getComputedStyle(root).getPropertyValue("--text").trim() || "#e8e8e8",
    textMuted: getComputedStyle(root).getPropertyValue("--text-muted").trim() || "#888888",
    border: getComputedStyle(root).getPropertyValue("--border").trim() || "#222222",
  };
}

function trendline(points: ScatterPoint[]): ChartPoint[] {
  if (points.length < 2) return [];

  const n = points.length;
  const sumX = points.reduce((sum, point) => sum + point.ndvi, 0);
  const sumY = points.reduce((sum, point) => sum + point.lst, 0);
  const sumXY = points.reduce((sum, point) => sum + point.ndvi * point.lst, 0);
  const sumXX = points.reduce((sum, point) => sum + point.ndvi * point.ndvi, 0);
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) return [];

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const minX = Math.min(...points.map((point) => point.ndvi));
  const maxX = Math.max(...points.map((point) => point.ndvi));

  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ];
}

export default function ScatterChart({
  data,
  loading,
  city,
}: Props): React.JSX.Element {
  const [themeColors, setThemeColors] = useState(() => getThemeColors());

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeColors(getThemeColors());
    };
    
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const chartData = useMemo<ChartData<"scatter", ChartPoint[]>>(
    () => ({
      datasets: [
        {
          label: "Grid cell",
          data: data.map((point) => ({ x: point.ndvi, y: point.lst })),
          backgroundColor: "rgba(215, 80, 39, 0.65)",
          borderColor: "rgba(215, 80, 39, 0.65)",
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Trend",
          data: trendline(data),
          backgroundColor: "#1a9850",
          borderColor: "#1a9850",
          borderWidth: 2,
          pointRadius: 0,
          showLine: true,
        },
      ],
    }),
    [data],
  );

  const options = useMemo<ChartOptions<"scatter">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: themeColors.textMuted,
            boxWidth: 10,
            font: { family: "DM Mono" },
          },
        },
        title: {
          display: true,
          text: `${city} — LST vs NDVI (1km grid cells)`,
          color: themeColors.text,
          font: { family: "DM Mono", size: 12, weight: 500 },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const point = context.raw as ChartPoint;
              return `NDVI ${point.x.toFixed(3)} / LST ${point.y.toFixed(2)}C`;
            },
          },
        },
      },
      scales: {
        x: {
          min: -0.1,
          max: 0.8,
          title: { display: true, text: "NDVI", color: themeColors.textMuted },
          grid: { color: themeColors.border },
          ticks: { color: themeColors.textMuted },
        },
        y: {
          min: 15,
          max: 60,
          title: { display: true, text: "LST C", color: themeColors.textMuted },
          grid: { color: themeColors.border },
          ticks: { color: themeColors.textMuted },
        },
      },
    }),
    [city, themeColors],
  );

  if (loading) {
    return (
      <section className="min-h-0 flex-1 border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="h-full min-h-64 animate-pulse" style={{ backgroundColor: "var(--surface-alt)" }} />
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 border-b p-4" style={{ borderColor: "var(--border)" }}>
      <div className="h-full min-h-64">
        <Scatter data={chartData} options={options} />
      </div>
    </section>
  );
}
