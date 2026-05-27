import { NextResponse } from "next/server";
import { getHBARPriceInUSD } from "coincap-hedera-plugin/tool.js";

// 60-second server-side cache
let cachedPrice: number | null = null;
let cacheExpiry = 0;

export const revalidate = 60;

export async function GET() {
  const now = Date.now();

  if (cachedPrice !== null && now < cacheExpiry) {
    return NextResponse.json({ priceUsd: cachedPrice });
  }

  try {
    const price = await getHBARPriceInUSD() as number | undefined;
    if (price && typeof price === "number" && price > 0) {
      cachedPrice = price;
      cacheExpiry = now + 60_000;
    }
    return NextResponse.json({ priceUsd: cachedPrice ?? 0 });
  } catch {
    return NextResponse.json({ priceUsd: cachedPrice ?? 0 });
  }
}
