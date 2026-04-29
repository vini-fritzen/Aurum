export function basePath() {
  const configured = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!configured) return "";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (!host.endsWith("github.io")) return "";
  }

  return configured;
}
