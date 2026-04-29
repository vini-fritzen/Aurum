import type { NextConfig } from "next";

/**
 * GitHub Pages: defina NEXT_PUBLIC_BASE_PATH="/REPO" e NEXT_PUBLIC_STATIC_EXPORT="1".
 * Vercel: `VERCEL=1` desabilita basePath/export para manter rotas server-side (/api).
 */
const isVercel = process.env.VERCEL === "1";
const basePath = isVercel ? "" : process.env.NEXT_PUBLIC_BASE_PATH || "";
const staticExport = !isVercel && process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.0:3000",
    "http://192.168.1.0:3000",
    "http://192.168.10.15:3000",
  ],
};

export default nextConfig;
