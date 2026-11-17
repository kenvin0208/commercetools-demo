import "server-only";
import { cookies } from "next/headers";
import { getMarket, type Market } from "@/src/lib/market";

export const MARKET_COOKIE = "namnx-market";

export async function getCurrentMarket(): Promise<Market> {
  const cookieStore = await cookies();
  return getMarket(cookieStore.get(MARKET_COOKIE)?.value);
}
