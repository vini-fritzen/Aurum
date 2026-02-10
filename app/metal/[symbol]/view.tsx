"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { formatMoney } from "@/lib/metals";
import { formatTime } from "@/lib/time";
import {
  filterWindow,
  downsampleAvg,
  computeChange,
  type Point,
} from "@/lib/series";
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
    }
  >;
};

type Currency = "USD" | "BRL";

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

// Lista total para lookup (mantém teu padrão)
const WINDOWS = [...SHORT_WINDOWS, ...LONG_WINDOWS] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

function tickFormatter(windowKey: WindowKey, v: number) {
  const d = new Date(v);

  // janelas curtas + 24h: hora:minuto
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

function normalizeSymbol(raw: string) {
  const s = raw.toUpperCase();
  const map: Record<string, string> = {
    AU: "XAU",
    AG: "XAG",
    PT: "XPT",
    PD: "XPD",
    CU: "XCU",
    XAU: "XAU",
    XAG: "XAG",
    XPT: "XPT",
    XPD: "XPD",
    XCU: "XCU",
  };
  return map[s] ?? "XAU";
}

export default function MetalClient() {
  const params = useParams<{ symbol: string }>();
  const raw = String(params?.symbol ?? "XAU");
  const symbol = normalizeSymbol(raw);

  const [windowKey, setWindowKey] = useState<WindowKey>("1h");
  const [currency, setCurrency] = useState<Currency>("BRL");

  // dropdown custom (>=24h)
  const [openLong, setOpenLong] = useState(false);

  const [latest, setLatest] = useState<Latest | null>(null);
  const [series, setSeries] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const base = basePath();
      const [a, b] = await Promise.all([
        fetch(`${base}/data/latest.json?ts=${Date.now()}`, { cache: "no-store" }),
        fetch(`${base}/data/${symbol}.json?ts=${Date.now()}`, { cache: "no-store" }),
      ]);

      if (!a.ok) throw new Error(`latest HTTP ${a.status}`);
      if (!b.ok) throw new Error(`series HTTP ${b.status}`);

      const latestJson = (await a.json()) as Latest;
      const seriesJson = (await b.json()) as Point[];

      setLatest(latestJson);
      setSeries(Array.isArray(seriesJson) ? seriesJson : []);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, UI_REFRESH_MS);
    return () => clearInterval(id);
  }, [symbol]);

  // fecha o dropdown ao clicar fora / ESC (sem quebrar os botões curtos)
  useEffect(() => {
    if (!openLong) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenLong(false);
    };

    // usa CAPTURE para decidir antes, mas NÃO mexe em nada fora do dropdown
    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-long-dropdown]")) {
        setOpenLong(false);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDownCapture, true); // capture = true

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [openLong]);

  const m = latest?.metals?.[symbol];
  const usdToBrl = latest?.usdToBrl ?? 0;

  // Variações baseadas no histórico em USD (percentual é o mesmo em BRL)
  const chg1h = useMemo(() => computeChange(series, 60 * 60 * 1000), [series]);
  const chg24h = useMemo(() => computeChange(series, 24 * 60 * 60 * 1000), [series]);
  const chg7d = useMemo(() => computeChange(series, 7 * 24 * 60 * 60 * 1000), [series]);

  // ======================
  // Janela + domínio X fixo (para “zoom” mudar só o bucket, não o período)
  // ======================
  const windowCfg = WINDOWS.find((w) => w.key === windowKey) ?? WINDOWS[1];

  const latestMs = useMemo(() => {
    const last = series[series.length - 1];
    return last ? last.ts * 1000 : Date.now();
  }, [series]);

  const xDomain = useMemo<[number, number]>(() => {
    return [latestMs - windowCfg.ms, latestMs];
  }, [latestMs, windowCfg.ms]);

  const windowed = useMemo(() => filterWindow(series, windowCfg.ms), [series, windowCfg.ms]);

  // Downsample só quando virar “grande”
  const shouldDownsample = windowed.length > 250;

  const sampled = useMemo(
    () => (shouldDownsample ? downsampleAvg(windowed, windowCfg.bucket) : windowed),
    [windowed, windowCfg.bucket, shouldDownsample]
  );

  // preço do gráfico depende da moeda selecionada
  const chartData = useMemo(() => {
    return sampled.map((p) => {
      const usd = p.usd_oz;
      const value = currency === "USD" ? usd : usdToBrl ? usd * usdToBrl : usd;
      return { ts: p.ts * 1000, price: value };
    });
  }, [sampled, currency, usdToBrl]);

  const hasEnough = windowed.length >= 12;
  const yPad = currency === "USD" ? 10 : 50;
  

  // label atual do dropdown longo
  const longSelectValue: (typeof LONG_WINDOWS)[number]["key"] =
    (LONG_WINDOWS.find((w) => w.key === windowKey)?.key as any) ?? "24h";

  const longLabel =
    LONG_WINDOWS.find((w) => w.key === longSelectValue)?.label ?? "24h";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm muted hover:text-white/90">
          ← Voltar
        </Link>
        <div className="text-xs muted">Atualizado: {formatTime(latest?.timestamp ?? null)}</div>
      </div>

      <div className="glass rounded-xl2 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs muted tracking-widest uppercase">{symbol}</div>
            <div className="text-2xl font-semibold">{m?.name ?? symbol}</div>
          </div>

          {/* Toggle USD/BRL */}
          <div className="flex rounded-xl2 border border-white/10 bg-white/5 p-1">
            {(["USD", "BRL"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={[
                  "px-3 py-1 text-xs rounded-xl2 transition",
                  currency === c ? "bg-white/10 border border-white/10" : "hover:bg-white/10",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {err && <div className="mt-3 text-sm muted">Erro: {err}</div>}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs muted">{currency}/oz</div>
            <div className="text-2xl font-semibold goldText">
              {currency === "USD"
                ? formatMoney(m?.usd_oz ?? null, "USD", 2)
                : formatMoney(m?.brl_oz ?? null, "BRL", 2)}
            </div>
            <div className="text-xs muted">
              {currency}/g:{" "}
              {currency === "USD"
                ? formatMoney(m?.usd_g ?? null, "USD", 4)
                : formatMoney(m?.brl_g ?? null, "BRL", 4)}
            </div>
          </div>

          <div>
            <div className="text-xs muted">{currency === "USD" ? "BRL/oz" : "USD/oz"}</div>
            <div className="text-2xl font-semibold">
              {currency === "USD"
                ? formatMoney(m?.brl_oz ?? null, "BRL", 2)
                : formatMoney(m?.usd_oz ?? null, "USD", 2)}
            </div>
            <div className="text-xs muted">
              câmbio USD→BRL:{" "}
              {usdToBrl
                ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(usdToBrl)
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-xs muted">Variação</div>
            <div className="text-sm">
              1h: {chg1h === null ? "—" : `${chg1h > 0 ? "+" : ""}${chg1h.toFixed(2)}%`}
            </div>
            <div className="text-sm">
              24h: {chg24h === null ? "—" : `${chg24h > 0 ? "+" : ""}${chg24h.toFixed(2)}%`}
            </div>
            <div className="text-sm">
              7d: {chg7d === null ? "—" : `${chg7d > 0 ? "+" : ""}${chg7d.toFixed(2)}%`}
            </div>
          </div>

          <div>
            <div className="text-xs muted">Histórico</div>
            <div className="text-sm">{series.length} pontos</div>
            <div className="text-xs muted">janela: {windowKey}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl2 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Gráfico ({currency}/oz)</h2>
          <div className="text-xs muted">
            {chartData.length} renderizados{shouldDownsample ? " (agregado)" : ""} • janela tem{" "}
            {windowed.length} pontos reais
          </div>
        </div>

        {/* Mantém estilo atual: adiciona botões curtos + dropdown custom a partir de 24h */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Botões < 24h */}
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

          {/* Separador */}
          <span className="mx-1 h-6 w-px bg-white/10" />

          {/* Dropdown custom >= 24h */}
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

        {!hasEnough ? (
          <div className="mt-6 rounded-xl2 border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold">Coletando histórico…</div>
            <div className="mt-1 text-sm muted">
              Ainda há poucos pontos ({windowed.length}). Aguarde...
            </div>
          </div>
        ) : (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="price"
                  domain={[`dataMin - ${yPad}`, `dataMax + ${yPad}`]}
                  tick={{ fill: "rgba(255,255,255,0.60)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  width={72}
                  tickFormatter={(v) =>
                    currency === "USD" ? `$${Number(v).toFixed(0)}` : `R$ ${Number(v).toFixed(0)}`
                  }
                />

                <Tooltip
                  contentStyle={{
                    background: "rgba(10,11,14,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.70)" }}
                  labelFormatter={(v) => new Date(Number(v)).toLocaleString("pt-BR")}
                  formatter={(v) => [formatMoney(Number(v), currency, 2), `${currency}/oz`]}
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="rgba(216,189,113,0.95)"
                  strokeWidth={2}
                  fill="url(#goldFill)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 text-xs muted">
          Fonte: <code className="text-white/80">public/data/{symbol}.json</code> • conversão via{" "}
          <code className="text-white/80">latest.json</code>
        </div>
      </div>
    </main>
  );
}
