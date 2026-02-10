"use client";

export function Badge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs muted">—</span>;
  const up = value > 0;
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        up ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200",
      ].join(" ")}
    >
      {up ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}
