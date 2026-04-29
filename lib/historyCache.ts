import type { Point } from "@/lib/series";

function key(symbol: string) {
  return `aurum_live_series_${symbol}`;
}

export function readCachedSeries(symbol: string): Point[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(symbol));
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeCachedSeries(symbol: string, points: Point[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(symbol), JSON.stringify(points.slice(-20000)));
  } catch {}
}

export function mergeSeries(base: Point[], extra: Point[]) {
  const map = new Map<number, number>();
  for (const p of [...base, ...extra]) {
    if (typeof p.ts !== "number" || typeof p.usd_oz !== "number") continue;
    if (!Number.isFinite(p.ts) || !Number.isFinite(p.usd_oz)) continue;
    map.set(p.ts, p.usd_oz);
  }
  return [...map.entries()]
    .map(([ts, usd_oz]) => ({ ts, usd_oz }))
    .sort((a, b) => a.ts - b.ts);
}
