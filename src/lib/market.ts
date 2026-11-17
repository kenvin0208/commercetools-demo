export const DEFAULT_MARKET = "AU" as const;

export const MARKETS = {
  AU: { locale: "en-AU", currency: "AUD", country: "AU", storeKey: process.env.CT_STORE_KEY_AU ?? process.env.NEXT_PUBLIC_CT_STORE_KEY_AU ?? "" },
  US: { locale: "en-US", currency: "USD", country: "US", storeKey: process.env.CT_STORE_KEY_US ?? process.env.NEXT_PUBLIC_CT_STORE_KEY_US ?? "" },
} as const;

export type MarketCode = keyof typeof MARKETS;
export type Market = (typeof MARKETS)[MarketCode];

export function isMarketCode(value: unknown): value is MarketCode {
  return value === "AU" || value === "US";
}

export function getMarket(code: unknown): Market {
  return MARKETS[isMarketCode(code) ? code : DEFAULT_MARKET];
}
