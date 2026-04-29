import { NextResponse } from "next/server";
import { fetchLiveLatest } from "@/lib/live";
import fs from "node:fs";
import path from "node:path";

type Point = { ts: number; usd_oz: number };

function nearestPointByAge(points: Point[], nowTs: number, ageSec: number) {
  if (!points.length) return null;
  const target = nowTs - ageSec;
  let best = points[0];
  let bestDiff = Math.abs(points[0].ts - target);
  for (const p of points) {
    const diff = Math.abs(p.ts - target);
    if (diff < bestDiff) {
      best = p;
      bestDiff = diff;
    }
  }
  return best;
}

export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchLiveLatest();
    const dataDir = path.join(process.cwd(), "public", "data");

    for (const symbol of Object.keys(data.metals)) {
      const metal = data.metals[symbol];
      if (typeof metal.usd_oz !== "number" || !Number.isFinite(metal.usd_oz)) continue;

      const seriesFile = path.join(dataDir, `${symbol}.json`);
      if (!fs.existsSync(seriesFile)) continue;
      const raw = JSON.parse(fs.readFileSync(seriesFile, "utf8"));
      const points = Array.isArray(raw) ? (raw as Point[]) : [];
      const p1h = nearestPointByAge(points, data.timestamp, 60 * 60);
      const p24h = nearestPointByAge(points, data.timestamp, 24 * 60 * 60);

      metal.chg_1h =
        p1h && p1h.usd_oz ? ((metal.usd_oz - p1h.usd_oz) / p1h.usd_oz) * 100 : null;
      metal.chg_24h =
        p24h && p24h.usd_oz ? ((metal.usd_oz - p24h.usd_oz) / p24h.usd_oz) * 100 : null;
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar cotações em tempo real" },
      { status: 502 }
    );
  }
}
