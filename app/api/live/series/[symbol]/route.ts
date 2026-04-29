import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const REMOTE_BASE =
  process.env.NEXT_PUBLIC_DATA_FALLBACK_URL ||
  "https://raw.githubusercontent.com/vini-fritzen/Aurum/main/public/data";

type Point = { ts: number; usd_oz: number };

function mergeSeries(base: Point[], extra: Point[]) {
  const map = new Map<number, number>();
  for (const p of [...base, ...extra]) {
    if (typeof p.ts !== "number" || typeof p.usd_oz !== "number") continue;
    if (!Number.isFinite(p.ts) || !Number.isFinite(p.usd_oz)) continue;
    map.set(p.ts, p.usd_oz);
  }
  return [...map.entries()].map(([ts, usd_oz]) => ({ ts, usd_oz })).sort((a, b) => a.ts - b.ts);
}

export async function GET(_: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const s = symbol.toUpperCase();
    const localFile = path.join(process.cwd(), "public", "data", `${s}.json`);
    const local = fs.existsSync(localFile) ? (JSON.parse(fs.readFileSync(localFile, "utf8")) as Point[]) : [];

    let remote: Point[] = [];
    try {
      const res = await fetch(`${REMOTE_BASE}/${s}.json?ts=${Date.now()}`, { cache: "no-store" });
      if (res.ok) remote = (await res.json()) as Point[];
    } catch {}

    const merged = mergeSeries(local, remote);
    return NextResponse.json(merged, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erro ao carregar série" }, { status: 500 });
  }
}
