"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMarket } from "@/src/components/site/MarketProvider";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { currency } = useMarket();
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    let active = true;
    const stored = localStorage.getItem("namnx-cart");
    if (stored) {
      try {
        const saved = JSON.parse(stored) as CartItem[];
        queueMicrotask(() => { if (active) setItems(saved); });
      } catch {
        queueMicrotask(() => { if (active) setItems([]); });
      }
    }
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const refreshPrices = async () => {
      const currentItems = itemsRef.current;
      if (currentItems.length === 0) return;
      try {
        const response = await fetch("/api/market/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: currentItems.map((item) => item.id) }),
        });
        if (!response.ok) return;
        const payload = await response.json() as { prices?: Record<string, { centAmount: number; currencyCode: string } | null> };
        setItems((current) => current.map((item) => {
          const price = payload.prices?.[item.id];
          return price ? { ...item, price: price.centAmount, currency: price.currencyCode } : { ...item, currency };
        }));
      } catch {
        // Keep the existing cart available if a market price refresh is temporarily unavailable.
      }
    };
    void refreshPrices();
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("namnx-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const marketItem = { ...item, currency };
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id
            ? { ...entry, ...marketItem, quantity: entry.quantity + quantity }
            : entry
        );
      }

      return [...current, { ...marketItem, quantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, subtotal, totalItems, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
