import { pctChange } from "@/lib/metals";

export type Point = { ts: number; usd_oz: number };

export function filterWindow(points: Point[], windowMs: number) {
  if (!points.length) return [];
  const latestMs = points[points.length - 1].ts * 1000;
  const cutoff = latestMs - windowMs;
  return points.filter((p) => p.ts * 1000 >= cutoff);
}

export function downsampleAvg(points: Point[], bucketMs: number) {
  if (!points.length) return [];
  const out: Point[] = [];

  let currentBucket = Math.floor(points[0].ts * 1000 / bucketMs) * bucketMs;
  let sum = 0;
  let count = 0;
  let lastTs = points[0].ts * 1000;

  for (const p of points) {
    const t = p.ts * 1000;
    const b = Math.floor(t / bucketMs) * bucketMs;

    if (b !== currentBucket) {
      out.push({ ts: Math.floor(lastTs / 1000), usd_oz: sum / count });
      currentBucket = b;
      sum = 0;
      count = 0;
    }

    sum += p.usd_oz;
    count += 1;
    lastTs = t;
  }

  if (count) out.push({ ts: Math.floor(lastTs / 1000), usd_oz: sum / count });
  return out;
}

export function computeChange(points: Point[], ageMs: number) {
  if (points.length < 2) return null;

  const latest = points[points.length - 1];
  const target = latest.ts * 1000 - ageMs;

  let best = points[0];
  let bestDiff = Math.abs(points[0].ts * 1000 - target);

  for (const p of points) {
    const diff = Math.abs(p.ts * 1000 - target);
    if (diff < bestDiff) {
      best = p;
      bestDiff = diff;
    }
  }

  return pctChange(best.usd_oz, latest.usd_oz);
}

export function normalizeCadence(points: Point[], stepSec = 10, maxGapSec = 30 * 60) {
  if (points.length <= 1) return points;

  const sorted = [...points]
    .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.usd_oz))
    .sort((a, b) => a.ts - b.ts);

  const out: Point[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = out[out.length - 1];
    const curr = sorted[i];
    const gap = curr.ts - prev.ts;

    if (gap > stepSec && gap <= maxGapSec) {
      const steps = Math.floor(gap / stepSec);
      for (let s = 1; s < steps; s++) {
        out.push({
          ts: prev.ts + s * stepSec,
          usd_oz: prev.usd_oz,
        });
      }
    }

    out.push(curr);
  }

  return out;
}
