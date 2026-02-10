"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { basePath } from "@/lib/base";
import { formatTime } from "@/lib/time";
import { filterWindow, downsampleAvg, type Point } from "@/lib/series";

const UI_REFRESH_MS = 30_000;

// Botões (somente < 24h)
const SHORT_WINDOWS = [
  { key: "30m", label: "30m", ms: 30 * 60 * 1000, bucket: 1 * 60 * 1000 },
  { key: "1h", label: "1h", ms: 60 * 60 * 1000, bucket: 2 * 60 * 1000 },
  { key: "3h", label: "3h", ms: 3 * 60 * 60 * 1000, bucket: 5 * 60 * 1000 },
  { key: "6h", label: "6h", ms: 6 * 60 * 60 * 1000, bucket: 10 * 60 * 1000 },
  { key: "12h", label: "12h", ms: 12 * 60 * 60 * 1000, bucket: 15 * 60 * 1000 },
] as const;

// Dropdown (>= 24h)
const LONG_WINDOWS = [
  { key: "24h", label: "24h", ms: 24 * 60 * 60 * 1000, bucket: 5 * 60 * 1000 },
  { key: "7d", label: "7d", ms: 7 * 24 * 60 * 60 * 1000, bucket: 30 * 60 * 1000 },
  { key: "30d", label: "30d", ms: 30 * 24 * 60 * 60 * 1000, bucket: 2 * 60 * 60 * 1000 },
  { key: "90d", label: "90d", ms: 90 * 24 * 60 * 60 * 1000, bucket: 6 * 60 * 60 * 1000 },
] as const;

const WINDOWS = [...SHORT_WINDOWS, ...LONG_WINDOWS] as const;
type WindowKey = (typeof WINDOWS)[number]["key"];

function tickFormatter(windowKey: WindowKey, v: number) {
  const d = new Date(v);
  if (
    windowKey === "30m" ||
    windowKey === "1h" ||
    windowKey === "3h" ||
    windowKey === "6h" ||
    windowKey === "12h" ||
    windowKey === "24h"
  ) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (windowKey === "7d") {
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { month: "2-digit", day: "2-digit" });
}

function hintPt(r: number | null) {
  if (r == null) return "Sem dados suficientes";
  if (r >= 85) return "Prata barata • Ouro caro";
  if (r <= 55) return "Prata cara • Ouro barato";
  return "Relação equilibrada";
}

export default function RatioClient() {
  // vamos usar Point[] reaproveitando usd_oz como "ratio"
  const [series, setSeries] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [windowKey, setWindowKey] = useState<WindowKey>("1h");
  const [openLong, setOpenLong] = useState(false);

  const load = async () => {
    setErr(null);
    try {
      const base = basePath();
      const [goldRes, silverRes] = await Promise.all([
        fetch(`${base}/data/XAU.json?ts=${Date.now()}`, { cache: "no-store" }),
        fetch(`${base}/data/XAG.json?ts=${Date.now()}`, { cache: "no-store" }),
      ]);

      if (!goldRes.ok) throw new Error(`XAU HTTP ${goldRes.status}`);
      if (!silverRes.ok) throw new Error(`XAG HTTP ${silverRes.status}`);

      const gold = (await goldRes.json()) as Point[];
      const silver = (await silverRes.json()) as Point[];

      // indexa prata por timestamp (segundos)
      const silverMap = new Map<number, number>();
      for (const p of silver) {
        if (
          typeof p.ts === "number" &&
          typeof p.usd_oz === "number" &&
          Number.isFinite(p.usd_oz) &&
          p.usd_oz > 0
        ) {
          silverMap.set(p.ts, p.usd_oz);
        }
      }

      const ratioSeries: Point[] = [];
      for (const g of gold) {
        const s = silverMap.get(g.ts);
        if (typeof g.ts !== "number") continue;
        if (typeof g.usd_oz !== "number" || !Number.isFinite(g.usd_oz) || g.usd_oz <= 0) continue;
        if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) continue;

        const ratio = g.usd_oz / s;

        ratioSeries.push({
          ts: g.ts,
          usd_oz: ratio,
        });
      }

      ratioSeries.sort((a, b) => a.ts - b.ts);
      setSeries(ratioSeries);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao montar série do ratio");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, UI_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // fecha dropdown ao clicar fora / ESC
  useEffect(() => {
    if (!openLong) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenLong(false);
    };

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-long-dropdown]")) setOpenLong(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [openLong]);

  const windowCfg = WINDOWS.find((w) => w.key === windowKey) ?? WINDOWS[7];

  const latestMs = useMemo(() => {
    const last = series[series.length - 1];
    return last ? last.ts * 1000 : Date.now();
  }, [series]);

  const xDomain = useMemo<[number, number]>(() => {
    return [latestMs - windowCfg.ms, latestMs];
  }, [latestMs, windowCfg.ms]);

  const windowed = useMemo(() => filterWindow(series, windowCfg.ms), [series, windowCfg.ms]);
  const shouldDownsample = windowed.length > 250;

  const sampled = useMemo(
    () => (shouldDownsample ? downsampleAvg(windowed, windowCfg.bucket) : windowed),
    [windowed, windowCfg.bucket, shouldDownsample]
  );

  // chartData com {ts(ms), value}
  const chartData = useMemo(() => {
    return sampled.map((p) => ({
      ts: p.ts * 1000,
      value: p.usd_oz,
    }));
  }, [sampled]);

  // domínio Y “zoomado” pra enxergar variação real
  const yDomain = useMemo<[number, number]>(() => {
    const vals = chartData
      .map((d) => d.value)
      .filter((v) => typeof v === "number" && Number.isFinite(v));

    // Se tiver 0 ou 1 ponto, cria uma “janelinha” em torno do valor
    if (vals.length < 2) {
      const v = vals[0];
      if (typeof v === "number") return [v - 1, v + 1];
      return [50, 90];
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    // range mínimo pra não “dar zoom demais”
    const range = Math.max(0.2, max - min);
    const pad = Math.max(0.4, range * 0.12);

    return [min - pad, max + pad];
  }, [chartData]);

  const currentRatio = useMemo(() => {
    const last = series[series.length - 1];
    return typeof last?.usd_oz === "number" ? last.usd_oz : null;
  }, [series]);

  const lastUpdated = useMemo(() => formatTime(series.at(-1)?.ts ?? null), [series]);

  // dropdown mostra o selecionado (>=24h)
  const longSelectValue: (typeof LONG_WINDOWS)[number]["key"] =
    (LONG_WINDOWS.find((w) => w.key === windowKey)?.key as any) ?? "24h";
  const longLabel = LONG_WINDOWS.find((w) => w.key === longSelectValue)?.label ?? "24h";

  // mínimo de pontos por janela (curtas aceitam menos)
  const minPoints =
    windowKey === "30m" ? 3 :
    windowKey === "1h" ? 4 :
    windowKey === "3h" ? 6 :
    windowKey === "6h" ? 8 :
    windowKey === "12h" ? 10 :
    12;

  const hasEnough = windowed.length >= minPoints;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm muted hover:text-white/90">
          ← Voltar
        </Link>
        <div className="text-xs muted">Atualizado: {lastUpdated}</div>
      </div>

      <div className="glass rounded-xl2 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs muted tracking-widest uppercase">Indicador</div>
            <h1 className="mt-1 text-2xl font-semibold">Ouro / Prata — Ratio</h1>
            <p className="mt-2 text-sm muted max-w-3xl leading-relaxed">
              Relação entre o preço do <span className="text-white/80">ouro</span> e da{" "}
              <span className="text-white/80">prata</span>. Quando sobe:{" "}
              <span className="text-white/80">ouro caro</span> ou{" "}
              <span className="text-white/80">prata barata</span>. Quando cai:{" "}
              <span className="text-white/80">ouro barato</span> ou{" "}
              <span className="text-white/80">prata cara</span>.
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs muted">Agora</div>
            <div className="mt-1 text-3xl font-semibold goldText">
              {currentRatio == null ? "—" : currentRatio.toFixed(2)}
            </div>
            <div className="mt-1 text-xs muted">{hintPt(currentRatio)}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl2 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <div className="text-xs muted">
            {chartData.length} renderizados{shouldDownsample ? " (agregado)" : ""} • janela tem{" "}
            {windowed.length} pontos reais
          </div>
        </div>

        {/* Botões curtos + dropdown a partir do 24h */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {SHORT_WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWindowKey(w.key)}
              className={[
                "rounded-xl2 border px-3 py-1 text-xs transition",
                windowKey === w.key
                  ? "border-gold-500/40 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              {w.label}
            </button>
          ))}

          <span className="mx-1 h-6 w-px bg-white/10" />

          <div className="relative" data-long-dropdown>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenLong((v) => !v);
              }}
              className={[
                "rounded-xl2 border px-3 py-1 text-xs transition outline-none",
                "border-white/10 bg-white/5 hover:bg-white/10",
                openLong ? "ring-1 ring-gold-500/35" : "",
              ].join(" ")}
              aria-haspopup="listbox"
              aria-expanded={openLong}
              title="Período longo"
            >
              <span className="mr-2">{longLabel}</span>
              <span className="inline-block translate-y-[1px] opacity-70">▾</span>
            </button>

            {openLong && (
              <div
                role="listbox"
                className="absolute left-0 mt-2 w-28 z-50 rounded-xl2 border border-white/10 bg-[#0B0C10]/95 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.55)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {LONG_WINDOWS.map((w) => {
                  const active = w.key === longSelectValue;
                  return (
                    <button
                      key={w.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWindowKey(w.key as WindowKey);
                        setOpenLong(false);
                      }}
                      className={[
                        "w-full text-left px-3 py-2 text-xs transition",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {err ? (
          <div className="mt-5 text-sm muted">Erro: {err}</div>
        ) : !hasEnough ? (
          <div className="mt-6 rounded-xl2 border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold">Coletando histórico…</div>
            <div className="mt-1 text-sm muted">
              Ainda há poucos pontos ({windowed.length}). Aguarde...
            </div>
          </div>
        ) : (
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ratioFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(216,189,113,0.45)" />
                    <stop offset="100%" stopColor="rgba(216,189,113,0.00)" />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />

                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={xDomain}
                  allowDataOverflow
                  tickFormatter={(v) => tickFormatter(windowKey, Number(v))}
                  minTickGap={28}
                  tick={{ fill: "rgba(255,255,255,0.60)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />

                <YAxis
                  dataKey="value"
                  domain={yDomain}
                  width={72}
                  tick={{ fill: "rgba(255,255,255,0.60)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickFormatter={(v) => Number(v).toFixed(1)}
                />

                <Tooltip
                  contentStyle={{
                    background: "rgba(10,11,14,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.70)" }}
                  labelFormatter={(v) => new Date(Number(v)).toLocaleString("pt-BR")}
                  formatter={(v) => [Number(v).toFixed(2), "Ouro/Prata"]}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="rgba(216,189,113,0.95)"
                  strokeWidth={2}
                  fill="url(#ratioFill)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 text-xs muted">
          Fonte: <code className="text-white/80">public/data/XAU.json</code> +{" "}
          <code className="text-white/80">public/data/XAG.json</code> (derivado em tempo de execução)
        </div>
      </div>
    </main>
  );
}
