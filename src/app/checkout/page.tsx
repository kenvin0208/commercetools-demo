"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@commercetools/checkout-browser-sdk";
import { useCart } from "@/src/components/site/CartProvider";
import {
  CHECKOUT_PROJECT_KEY,
  CHECKOUT_REGION,
  IS_CHECKOUT_CONFIGURED,
} from "@/src/lib/commercetools/config";
import type { CheckoutRecovery } from "@/src/lib/checkout/errors";
import { Button } from "@/src/components/ui/Button";
import { useMarket } from "@/src/components/site/MarketProvider";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { market, locale, currency } = useMarket();
  const clearCartRef = useRef(clearCart);
  const subtotalRef = useRef(subtotal);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRecovery, setSessionRecovery] = useState<CheckoutRecovery | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    subtotalRef.current = subtotal;
  }, [subtotal]);

  const formattedSubtotal = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }).format(subtotal / 100),
    [subtotal, locale, currency]
  );

  useEffect(() => {
    let active = true;

    const createCheckoutSession = async () => {
      if (paymentComplete || !IS_CHECKOUT_CONFIGURED || items.length === 0) {
        setSessionId(null);
        setSessionError(null);
        return;
      }

      setLoadingSession(true);
      setSessionError(null);
      setSessionRecovery(null);

      try {
        const response = await fetch("/api/checkout/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            market,
              items: items.map((item) => ({
                productId: item.id,
                variantId: 1,
                quantity: item.quantity,
              })),
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          if (active && ["address", "cart", "login"].includes(payload?.recovery)) setSessionRecovery(payload.recovery);
          throw new Error(payload?.error || "Unable to create checkout session");
        }

        if (!active) return;
        setSessionId(payload.sessionId || null);
      } catch (error) {
        if (!active) return;
        console.error("Checkout session creation failed", error);
        setSessionId(null);
        setSessionError(error instanceof Error ? error.message : "Unable to create checkout session");
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    };

    void createCheckoutSession();

    return () => {
      active = false;
    };
  }, [items, paymentComplete, retryAttempt, market]);

  useEffect(() => {
    if (paymentComplete || !sessionId || !IS_CHECKOUT_CONFIGURED) {
      return;
    }

    const loadSdk = async () => {
      try {
        const sdk = await import("@commercetools/checkout-browser-sdk");
        setCheckoutError(null);

        const buyer = {
          projectKey: CHECKOUT_PROJECT_KEY,
          sessionId,
          region: CHECKOUT_REGION,
          locale,
          currencyLocale: locale,
          onInfo: (message: Message) => {
            if (message.code !== "checkout_completed") {
              return;
            }

            const payload = message.payload;
            const order = typeof payload === "object" && payload !== null && "order" in payload
              ? payload.order
              : null;
            const completedOrderId = typeof order === "object" && order !== null && "id" in order && typeof order.id === "string"
              ? order.id
              : null;

            setOrderId(completedOrderId);
            setSessionId(null);
            setLastOrderTotal(subtotalRef.current);
            setPaymentComplete(true);
            clearCartRef.current();
          },
          logError: true,
          logWarn: true,
          onError: (message: Message) => {
            const detail = `${message.code}${message.correlationId ? ` (${message.correlationId})` : ""}`;
            console.error("Checkout SDK error", message);
            setCheckoutError(`Checkout could not load: ${detail}`);
          },
        };

        sdk.checkoutFlow(buyer);
      } catch (error) {
        console.error("Checkout SDK load failed", error);
        setCheckoutError(error instanceof Error ? error.message : "Checkout SDK failed to load");
      }
    };

    void loadSdk();
  }, [paymentComplete, sessionId, locale]);

  if (paymentComplete) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Sandbox payment</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900">Payment successful</h1>
          <p className="mt-4 text-lg text-slate-600">
            Your demo order was approved and your payment method was processed in sandbox mode.
          </p>
          <div className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm">
            Total paid: {new Intl.NumberFormat(locale, { style: "currency", currency }).format(lastOrderTotal / 100)}
          </div>
          {orderId ? <p className="mt-4 text-sm text-slate-600">Order ID: {orderId}</p> : null}
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/products" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Continue shopping
            </Link>
            <Link href="/cart" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Checkout</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Secure checkout</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">Your cart is empty.</p>
          <Link href="/products" className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">Checkout and payment</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Sandbox
                </span>
              </div>

              {!IS_CHECKOUT_CONFIGURED ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Checkout is not configured yet. Please add values for
                  <span className="font-semibold"> NEXT_PUBLIC_CT_PROJECT_KEY</span> and
                  <span className="font-semibold"> NEXT_PUBLIC_CT_REGION</span> in your environment.
                </div>
              ) : (
                <>
                  {loadingSession ? (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Creating a live Checkout session from commercetools...
                    </div>
                  ) : sessionError ? (
                    <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <p>{sessionError}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {sessionRecovery === "address" && <Link href="/account/addresses" className="font-semibold underline underline-offset-4">Change delivery address</Link>}
                        {sessionRecovery === "cart" && <Link href="/cart" className="font-semibold underline underline-offset-4">Review cart</Link>}
                        {sessionRecovery === "login" && <Link href="/account/login?returnTo=%2Fcheckout" className="font-semibold underline underline-offset-4">Sign in</Link>}
                        <Button size="sm" variant="secondary" onClick={() => setRetryAttempt(attempt => attempt + 1)}>Try again</Button>
                      </div>
                    </div>
                  ) : checkoutError ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {checkoutError}
                    </div>
                  ) : (
                    <div data-ctc className="mt-6 min-h-[320px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4" />
                  )}
                </>
              )}
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Order summary</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{new Intl.NumberFormat(locale, { style: "currency", currency }).format((item.price * item.quantity) / 100)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formattedSubtotal}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between"><span>Tax</span><span>Included</span></div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 text-lg font-bold text-slate-900">
              <div className="flex justify-between"><span>Total</span><span>{formattedSubtotal}</span></div>
            </div>

            <Button
              type="button"
              onClick={() => clearCart()}
              variant="secondary"
              className="mt-3 w-full"
            >
              Clear cart
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
