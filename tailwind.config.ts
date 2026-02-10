import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0B0E",
          900: "#0E1016",
          850: "#121522",
          800: "#151A2A",
          700: "#1C2236",
        },
        gold: {
          50:  "#FFF9E8",
          100: "#FFF0C2",
          200: "#FFE08A",
          300: "#FFD05C",
          400: "#F4C24F",
          500: "#D8BD71",
          600: "#BEA256",
          700: "#9B8346",
          800: "#6A5B34",
          900: "#3B3322",
        },
        silver: "#BFC7D5"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.35)",
        insetGlow: "inset 0 1px 0 rgba(255,255,255,.06)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
} satisfies Config;
