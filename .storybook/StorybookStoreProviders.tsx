"use client";

import type { ReactNode } from "react";
import type { Decorator } from "@storybook/nextjs";
import { CartProvider } from "@/src/components/site/CartProvider";
import { MarketProvider } from "@/src/components/site/MarketProvider";

export function StorybookStoreProviders({ children }: { children: ReactNode }) {
  return (
    <MarketProvider initialMarket="US">
      <CartProvider>{children}</CartProvider>
    </MarketProvider>
  );
}

export const withStoreProviders: Decorator = (Story) => (
  <StorybookStoreProviders>
    <Story />
  </StorybookStoreProviders>
);
