export const OZ_TROY_TO_GRAM = 31.1034768;

export function usdOzToUsdGram(usdPerOz: number) {
  return usdPerOz / OZ_TROY_TO_GRAM;
}

export function formatMoney(value: number | null, currency: "USD" | "BRL", digits = 2) {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function pctChange(from: number, to: number) {
  if (!from) return null;
  return ((to - from) / from) * 100;
}
