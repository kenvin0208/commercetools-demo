"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_MARKET, MARKETS, type MarketCode } from "@/src/lib/market";

type MarketContextValue = { market: MarketCode; locale: string; currency: string; country: string; switchMarket: (market: MarketCode) => Promise<void> };
const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ initialMarket, children }: { initialMarket: MarketCode; children: ReactNode }) {
  const [market, setMarket] = useState<MarketCode>(initialMarket);
  const router = useRouter();

  const switchMarket = useCallback(async (nextMarket: MarketCode) => {
    if (nextMarket === market) return;
    const response = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market: nextMarket }),
    });
    if (!response.ok) throw new Error("Unable to switch market");
    setMarket(nextMarket);
    window.dispatchEvent(new CustomEvent("market-changed", { detail: nextMarket }));
    router.refresh();
  }, [market, router]);

  const value = useMemo(() => {
    const config = MARKETS[market ?? DEFAULT_MARKET];
    return { market, locale: config.locale, currency: config.currency, country: config.country, switchMarket };
  }, [market, switchMarket]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) throw new Error("useMarket must be used inside MarketProvider");
  return context;
}
