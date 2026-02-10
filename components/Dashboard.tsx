"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { MetalCard } from "@/components/MetalCard";
import { RatioCard } from "@/components/RatioCard";
import { formatTime } from "@/lib/time";
import { basePath } from "@/lib/base";

type Latest = {
  timestamp: number;
  usdToBrl: number;
  metals: Record<
    string,
    {
      name: string;
      usd_oz: number | null;
      usd_g: number | null;
      brl_oz: number | null;
      brl_g: number | null;
      chg_1h: number | null;
      chg_24h: number | null;
    }
  >;
};

const UI_REFRESH_MS = 30_000;

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [latest, setLatest] = useState<Latest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const base = basePath();
      const res = await fetch(`${base}/data/latest.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Latest;
      setLatest(data);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, UI_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const lastUpdated = useMemo(() => formatTime(latest?.timestamp ?? null), [latest?.timestamp]);

  const cards = useMemo(() => {
    if (!latest) return [];
    return Object.entries(latest.metals).map(([symbol, m]) => ({
      symbol,
      name: m.name,
      usd_oz: m.usd_oz,
      usd_g: m.usd_g,
      brl_oz: m.brl_oz,
      brl_g: m.brl_g,
      chg_1h: m.chg_1h,
      chg_24h: m.chg_24h,
    }));
  }, [latest]);

  const ratio = useMemo(() => {
    const gold = latest?.metals?.XAU?.usd_oz ?? null;
    const silver = latest?.metals?.XAG?.usd_oz ?? null;
    if (!gold || !silver) return null;
    if (gold <= 0 || silver <= 0) return null;
    return gold / silver;
  }, [latest]);

  return (
    <div className="space-y-6">
      <TopBar lastUpdated={lastUpdated} onRefresh={load} isRefreshing={loading} />

      {err ? (
        <div className="glass rounded-xl2 p-5">
          <div className="text-sm font-semibold">Não foi possível carregar</div>
          <div className="mt-1 text-sm muted">{err}</div>
          <div className="mt-4 text-xs muted">
            Rode <code className="text-white/80">npm run fetch:data</code> para gerar{" "}
            <code className="text-white/80">public/data</code>.
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && !latest ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="glass rounded-xl2 p-5 animate-pulse">
              <div className="h-4 w-16 bg-white/10 rounded" />
              <div className="mt-2 h-5 w-28 bg-white/10 rounded" />
              <div className="mt-6 h-8 w-40 bg-white/10 rounded" />
              <div className="mt-2 h-3 w-24 bg-white/10 rounded" />
            </div>
          ))
        ) : (
          <>
            <RatioCard ratio={ratio} />
            {cards.map((q) => (
              <MetalCard key={q.symbol} q={q} />
            ))}
          </>
        )}
      </div>

      <div className="glass rounded-xl2 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Como funciona</h2>
          <div className="text-xs muted">UI: {Math.round(UI_REFRESH_MS / 1000)}s • Actions: 5 min</div>
        </div>
        <div className="mt-3 text-sm muted leading-relaxed">
          O GitHub Actions coleta preços e câmbio, salva histórico em <code className="text-white/80">public/data</code> e o site só lê esses JSONs.
          Sem banco, sem localStorage, sem chave.
        </div>
      </div>
    </div>
  );
}
