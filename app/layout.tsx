import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurum | Metals Market Analysis",
  description:
    "Metais (ouro, prata, platina, paládio, cobre) — USD/BRL, por grama, histórico e gráficos.",
  icons: {
    icon: [
      { url: "favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
