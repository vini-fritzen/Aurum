"use client";

import Link from "next/link";

type Props = {
  ratio: number | null;
};

function hintPt(r: number | null) {
  if (r == null) return "Sem dados suficientes";
  if (r >= 85) return "Prata barata em relação ao ouro";
  if (r <= 55) return "Prata cara em relação ao ouro";
  return "Zona neutra";
}

// ratio 82.40 => 82.40% do anel (clamp 0..100)
function ratioToPercent(r: number | null) {
  if (r == null) return 0;
  const v = Math.max(0, Math.min(100, r));
  return v / 100;
}

export function RatioCard({ ratio }: Props) {
  const progress = ratioToPercent(ratio);

  return (
    <Link href="/ratio" className="block">
      <div className="glass rounded-xl2 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs muted tracking-widest uppercase">Indicador</div>
            <div className="mt-1 text-lg font-semibold">Ouro / Prata</div>
          </div>

          <div
            className="text-xs muted hover:text-white/90 transition"
            title="Ver análise do ratio"
          >
            Ver →
          </div>
        </div>

        {/* CÍRCULO */}
        <div className="-mt-4 flex items-center justify-center">
          <div className="relative h-36 w-36">
            {/* base */}
            <div className="absolute inset-0 rounded-full border border-white/10 bg-black/10" />

            {/* anel metálico */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  ratio == null
                    ? "conic-gradient(rgba(255,255,255,0.15) 0deg, rgba(255,255,255,0.15) 360deg)"
                    : ratio >= 85
                    ? `
                      conic-gradient(
                        #F2E2A8 0deg,
                        #D9B777 ${progress * 180}deg,
                        #B8963E ${progress * 360}deg,
                        rgba(255,255,255,0.10) 0deg
                      )
                    `
                    : ratio <= 55
                    ? `
                      conic-gradient(
                        #FFFFFF 0deg,
                        #C9CCD1 ${progress * 180}deg,
                        #9FA4AA ${progress * 360}deg,
                        rgba(255,255,255,0.10) 0deg
                      )
                    `
                    : `
                      conic-gradient(
                        #F2E2A8 0deg,
                        #D9B777 ${progress * 360}deg,
                        rgba(255,255,255,0.10) 0deg
                      )
                    `,
                boxShadow:
                  ratio == null
                    ? "none"
                    : ratio >= 85
                    ? "0 0 26px rgba(217,183,119,0.45)"
                    : ratio <= 55
                    ? "0 0 24px rgba(200,200,200,0.35)"
                    : "0 0 18px rgba(217,183,119,0.25)",
              }}
            />

            {/* miolo */}
            <div className="absolute inset-[10px] rounded-full bg-[#0B0C10] border border-white/10 flex flex-col items-center justify-center">
              <div className="text-xs muted">Ratio</div>

              <div
                className="mt-1 text-2xl font-semibold"
                style={{
                  color:
                    ratio == null
                      ? "rgba(255,255,255,0.85)"
                      : ratio >= 85
                      ? "#D9B777"
                      : ratio <= 55
                      ? "#C9CCD1"
                      : "#D9B777",
                }}
              >
                {ratio == null ? "—" : ratio.toFixed(2)}
              </div>

              <div className="mt-1 text-[11px] muted">
                BRL • USD
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs muted text-center">
          {hintPt(ratio)}
        </div>
      </div>
    </Link>
  );
}
