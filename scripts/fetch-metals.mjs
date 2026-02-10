import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "data");
const OZ_TROY_TO_GRAM = 31.1034768;

const METALS = [
  { apiSymbol: "XAU", outSymbol: "XAU", name: "Ouro" },
  { apiSymbol: "XAG", outSymbol: "XAG", name: "Prata" },
  { apiSymbol: "XPT", outSymbol: "XPT", name: "Platina" },
  { apiSymbol: "XPD", outSymbol: "XPD", name: "Paládio" },
  { apiSymbol: "HG",  outSymbol: "XCU", name: "Cobre" },
];

const nowSec = () => Math.floor(Date.now() / 1000);

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file, obj) { fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8"); }

async function fetchJson(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
      return data;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 300 + i * 400));
    }
  }
  throw lastErr;
}

function usdOzToUsdGram(usdOz) { return usdOz / OZ_TROY_TO_GRAM; }

function prune(points, maxDays = 120, maxPoints = 60000) {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const filtered = points.filter(p => (p.ts * 1000) >= cutoff);
  return filtered.slice(-maxPoints);
}

function nearestPointByAge(points, ageMs) {
  if (!points.length) return null;
  const latest = points[points.length - 1];
  const target = latest.ts * 1000 - ageMs;

  let best = points[0];
  let bestDiff = Math.abs(points[0].ts * 1000 - target);

  for (const p of points) {
    const diff = Math.abs(p.ts * 1000 - target);
    if (diff < bestDiff) { best = p; bestDiff = diff; }
  }
  return best;
}

function pctChange(from, to) {
  if (!from) return null;
  return ((to - from) / from) * 100;
}

async function main() {
  ensureDir(OUT_DIR);

  const fx = await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL");
  const usdToBrl = fx?.rates?.BRL;
  if (typeof usdToBrl !== "number") throw new Error("USD->BRL inválido (Frankfurter)");

  const t = nowSec();
  const latest = { timestamp: t, usdToBrl, metals: {} };

  for (const m of METALS) {
    const priceData = await fetchJson(`https://api.gold-api.com/price/${m.apiSymbol}`);
    const usd_oz = typeof priceData.price === "number" ? priceData.price : null;

    const usd_g = usd_oz !== null ? usdOzToUsdGram(usd_oz) : null;
    const brl_oz = usd_oz !== null ? usd_oz * usdToBrl : null;
    const brl_g  = usd_g  !== null ? usd_g  * usdToBrl : null;

    const seriesFile = path.join(OUT_DIR, `${m.outSymbol}.json`);
    const points = readJson(seriesFile, []);
    const arr = Array.isArray(points) ? points : [];

    const last = arr[arr.length - 1];
    if (!last || last.ts !== t) {
      if (usd_oz !== null) arr.push({ ts: t, usd_oz });
    }

    const pruned = prune(arr);

    const p1h = nearestPointByAge(pruned, 60 * 60 * 1000);
    const p24h = nearestPointByAge(pruned, 24 * 60 * 60 * 1000);
    const lastP = pruned[pruned.length - 1];

    const chg_1h = (p1h && lastP) ? pctChange(p1h.usd_oz, lastP.usd_oz) : null;
    const chg_24h = (p24h && lastP) ? pctChange(p24h.usd_oz, lastP.usd_oz) : null;

    writeJson(seriesFile, pruned);

    latest.metals[m.outSymbol] = { name: m.name, usd_oz, usd_g, brl_oz, brl_g, chg_1h, chg_24h };

    await new Promise(r => setTimeout(r, 180));
  }

  writeJson(path.join(OUT_DIR, "latest.json"), latest);
  console.log("OK: public/data atualizado");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
