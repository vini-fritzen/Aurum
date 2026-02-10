"use client";
import Image from "next/image";
export function TopBar({
  lastUpdated,
  onRefresh,
  isRefreshing,
}: {
  lastUpdated: string;
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
}) {
  return (
    <div className="glass rounded-xl2 px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Image
          src="/aurum-icon.png"
          alt="AURUM"
          width={65}
          height={65}
        />
        <div className="flex-1 items-center gap-2 ">
          <div className="text-sm muted">Aurum - Metals Market Analysis</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            <span className="goldText">Luxo</span> em dados. <span className="muted">Poder</span> na decisão.
          </h1>
          <div className="mt-1 text-xs muted">Última atualização: {lastUpdated}</div>
        </div>
      </div>

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="group relative overflow-hidden rounded-xl2 border border-white/10 px-4 py-2 text-sm font-medium
                   bg-white/5 hover:bg-white/10 transition disabled:opacity-60"
      >
        <span className="relative z-10">{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition
                     bg-[radial-gradient(700px_180px_at_50%_0%,rgba(216,189,113,.28),transparent_55%)]"
        />
      </button>
    </div>
  );
}
