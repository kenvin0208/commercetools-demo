import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/src/components/site/CartProvider";
import { SiteHeader } from "@/src/components/site/Header";
import { SiteFooter } from "@/src/components/site/Footer";
import { MarketProvider } from "@/src/components/site/MarketProvider";
import { DEFAULT_MARKET } from "@/src/lib/market";
import { getCurrentMarket } from "@/src/lib/market-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NamNX Store",
  description: "B2C storefront demo powered by commercetools",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const market = await getCurrentMarket();
  const marketCode = market.country === "US" ? "US" : DEFAULT_MARKET;
  return (
    <html
      lang={market.locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <MarketProvider initialMarket={marketCode}>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
