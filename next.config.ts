import type { NextConfig } from "next";

/**
 * Para GitHub Pages (https://usuario.github.io/REPO):
 * defina NEXT_PUBLIC_BASE_PATH="/REPO" no workflow deploy.yml.
 * Em dev, fica vazio.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  // Opcional: evita warning se você abrir via IP na rede
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.0:3000",
    "http://192.168.1.0:3000",
    "http://192.168.10.15:3000",
  ],
};

export default nextConfig;
