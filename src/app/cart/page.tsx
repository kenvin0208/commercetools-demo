"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/src/components/site/CartProvider";
import { Button } from "@/src/components/ui/Button";
import { useMarket } from "@/src/components/site/MarketProvider";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { locale, currency } = useMarket();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Cart</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Your bag</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">Your cart is empty.</p>
          <Link href="/products" className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative h-28 w-24 overflow-hidden rounded-2xl bg-slate-100">
                  {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : null}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{new Intl.NumberFormat(locale, { style: "currency", currency }).format(item.price / 100)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-slate-200 bg-slate-50">
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}>−</Button>
                      <span className="min-w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>+</Button>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => removeItem(item.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Summary</h2>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{new Intl.NumberFormat(locale, { style: "currency", currency }).format(subtotal / 100)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between"><span>Tax</span><span>Included</span></div>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{new Intl.NumberFormat(locale, { style: "currency", currency }).format(subtotal / 100)}</span>
              </div>
            </div>
            <Link href="/checkout" className="mt-6 block rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
