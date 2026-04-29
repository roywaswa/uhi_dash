export type CityKey = "Nairobi" | "Phoenix" | "Delhi";

export interface TileUrls {
  lst: string;
  ndvi: string;
  vulnerability: string;
}

export interface Stats {
  meanLst: number;
  maxLst: number;
  minLst: number;
  stdLst: number;
  meanNdvi: number;
  tierPct: Record<string, number>;
  highRiskPct: number;
}

export interface ScatterPoint {
  ndvi: number;
  lst: number;
}

export type ActiveLayer = "lst" | "ndvi" | "vulnerability";
