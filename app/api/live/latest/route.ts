import { NextResponse } from "next/server";
import { fetchLiveLatest } from "@/lib/live";

export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchLiveLatest();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar cotações em tempo real" },
      { status: 502 }
    );
  }
}
