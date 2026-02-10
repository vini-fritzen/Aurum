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
