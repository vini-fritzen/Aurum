import type { Point } from "@/lib/series";
import { basePath } from "@/lib/base";

const REMOTE_BASE =
  process.env.NEXT_PUBLIC_DATA_FALLBACK_URL ||
  "https://raw.githubusercontent.com/vini-fritzen/Aurum/main/public/data";

export async function fetchSeriesWithRemoteFallback(symbol: string): Promise<Point[]> {
  const base = basePath();
  const localRes = await fetch(`${base}/data/${symbol}.json?ts=${Date.now()}`, { cache: "no-store" });
  const local = localRes.ok ? ((await localRes.json()) as Point[]) : [];

  if (Array.isArray(local) && local.length >= 50) return local;

  try {
    const remoteRes = await fetch(`${REMOTE_BASE}/${symbol}.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!remoteRes.ok) return Array.isArray(local) ? local : [];
    const remote = (await remoteRes.json()) as Point[];
    return Array.isArray(remote) && remote.length > (local?.length ?? 0) ? remote : local;
  } catch {
    return Array.isArray(local) ? local : [];
  }
}
