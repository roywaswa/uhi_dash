"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  value: number;
  onChange: (year: number) => void;
}

const MIN_YEAR = 2019;
const MAX_YEAR = 2025;

export default function TimeSlider({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const percentage = ((value - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newYear = Math.round(
      MIN_YEAR + (percentage / 100) * (MAX_YEAR - MIN_YEAR)
    );
    onChange(newYear);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newYear = Math.round(
      MIN_YEAR + (percentage / 100) * (MAX_YEAR - MIN_YEAR)
    );
    onChange(newYear);
  };

  useEffect(() => {
    if (isDragging.current) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, []);

  return (
    <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
        Year
      </p>

      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative h-24 flex items-center group"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-[#313695] via-[#d73027] to-[#a50026] rounded opacity-30 top-1/2 -translate-y-1/2" />

        {/* Filled track */}
        <div
          className="absolute left-0 h-1 bg-gradient-to-r from-[#313695] via-[#d73027] to-[#a50026] rounded top-1/2 -translate-y-1/2 transition-all"
          style={{ width: `${percentage}%` }}
        />

        {/* Tick marks */}
        <div className="absolute inset-x-0 h-8 flex justify-between top-1/2 -translate-y-1/2 pointer-events-none">
          {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }).map((_, i) => {
            const year = MIN_YEAR + i;
            const isActive = year <= value;
            return (
              <div
                key={year}
                className="flex flex-col items-center cursor-pointer transition-colors"
                style={{
                  color: isActive ? "var(--accent)" : "var(--muted)",
                  opacity: isActive ? 1 : 0.5,
                  pointerEvents: "auto",
                }}
                onClick={() => onChange(year)}
              >
                <div
                  className="w-0.5 transition-all"
                  style={{
                    height: isActive ? "12px" : "8px",
                    backgroundColor: isActive ? "var(--accent)" : "var(--muted)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Thumb (draggable handle) */}
        <div
          className="absolute w-6 h-6 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-xl hover:scale-110 z-10"
          style={{ left: `${percentage}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-1 rounded-full border-2" style={{ borderColor: "var(--accent)" }} />
        </div>

        {/* Year labels at bottom */}
        <div className="absolute left-0 right-0 top-full mt-2 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
          {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }).map((_, i) => {
            const year = MIN_YEAR + i;
            return (
              <span key={year} className="text-center flex-1">
                {year}
              </span>
            );
          })}
        </div>
      </div>

      {/* Display current year */}
      <div className="mt-12 text-center">
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--accent)" }}>
          {value}
        </div>
        <div className="text-xs uppercase tracking-[0.1em] mt-1" style={{ color: "var(--muted)" }}>
          {value === 2019 && "Start of Dataset"}
          {value === 2025 && "Latest Data"}
          {value > 2019 && value < 2025 && `Summer ${value}`}
        </div>
      </div>
    </div>
  );
}
