"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/metals";
import { Badge } from "@/components/Badge";

type CardQuote = {
  symbol: string;
  name: string;
  usd_oz: number | null;
  usd_g: number | null;
  brl_oz: number | null;
  brl_g: number | null;
  chg_1h: number | null;
  chg_24h: number | null;
};

export function MetalCard({ q }: { q: CardQuote }) {
  return (
    <Link href={`/metal/${q.symbol}`} className="block">
      <div className="glass rounded-xl2 p-5 hover:bg-white/[0.06] transition">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs muted tracking-widest uppercase">{q.symbol}</div>
            <div className="text-lg font-semibold">{q.name}</div>
          </div>
          <div className="text-xs muted">spot</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs muted">BRL/oz</div>
            <div className="text-xl font-semibold goldText">{formatMoney(q.brl_oz, "BRL", 2)}</div>
            <div className="text-xs muted">BRL/g: {formatMoney(q.brl_g, "BRL", 4)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs muted">USD/oz</div>
            <div className="text-xl font-semibold">{formatMoney(q.usd_oz, "USD", 2)}</div>
            <div className="text-xs muted">USD/g: {formatMoney(q.usd_g, "USD", 4)}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            <div className="text-xs muted">Variação 1h</div>
            <Badge value={q.chg_1h} />
          </div>
          <div className="text-right">
            <div className="text-xs muted">Variação 24h</div>
            <Badge value={q.chg_24h} />
          </div>
        </div>

        <div className="mt-4 text-xs muted">Clique para abrir análise completa →</div>
      </div>
    </Link>
  );
}
