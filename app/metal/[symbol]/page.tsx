import MetalClient from "./view";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { symbol: "XAU" },
    { symbol: "XAG" },
    { symbol: "XPT" },
    { symbol: "XPD" },
    { symbol: "XCU" },
    { symbol: "AU" },
    { symbol: "AG" },
    { symbol: "PT" },
    { symbol: "PD" },
    { symbol: "CU" },
  ];
}

export default function Page() {
  return <MetalClient />;
}
