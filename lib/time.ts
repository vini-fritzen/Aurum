export function formatTime(tsSec: number | null) {
  if (!tsSec) return "—";
  const d = new Date(tsSec * 1000);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
