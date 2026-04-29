import { OZ_TROY_TO_GRAM } from "@/lib/metals";

const METALS = [
  { apiSymbol: "XAU", outSymbol: "XAU", name: "Ouro" },
  { apiSymbol: "XAG", outSymbol: "XAG", name: "Prata" },
  { apiSymbol: "XPT", outSymbol: "XPT", name: "Platina" },
  { apiSymbol: "XPD", outSymbol: "XPD", name: "Paládio" },
  { apiSymbol: "HG", outSymbol: "XCU", name: "Cobre" },
] as const;

export type LiveLatest = {
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

function usdOzToUsdGram(usdPerOz: number) {
  return usdPerOz / OZ_TROY_TO_GRAM;
}

export async function fetchLiveLatest(): Promise<LiveLatest> {
  const fxRes = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL", {
    cache: "no-store",
  });
  if (!fxRes.ok) throw new Error(`Câmbio indisponível (HTTP ${fxRes.status})`);

  const fxData = await fxRes.json();
  const usdToBrl = Number(fxData?.rates?.BRL);
  if (!Number.isFinite(usdToBrl)) throw new Error("Câmbio USD/BRL inválido");

  const metalEntries = await Promise.all(
    METALS.map(async (m) => {
      const res = await fetch(`https://api.gold-api.com/price/${m.apiSymbol}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`${m.name} indisponível (HTTP ${res.status})`);
      const data = await res.json();
      const usd_oz = typeof data?.price === "number" ? data.price : null;

      const usd_g = usd_oz !== null ? usdOzToUsdGram(usd_oz) : null;
      const brl_oz = usd_oz !== null ? usd_oz * usdToBrl : null;
      const brl_g = usd_g !== null ? usd_g * usdToBrl : null;

      return [
        m.outSymbol,
        {
          name: m.name,
          usd_oz,
          usd_g,
          brl_oz,
          brl_g,
          chg_1h: null,
          chg_24h: null,
        },
      ] as const;
    })
  );

  return {
    timestamp: Math.floor(Date.now() / 1000),
    usdToBrl,
    metals: Object.fromEntries(metalEntries),
  };
}
