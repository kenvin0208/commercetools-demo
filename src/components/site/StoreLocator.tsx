"use client";

import Link from "next/link";
import { useState } from "react";
import type { StoreLocation } from "@/src/lib/commercetools/stores";
import { StoreMap } from "@/src/components/site/StoreMap";

export function StoreLocator({ stores }: { stores: StoreLocation[] }) {
  const [selectedKey, setSelectedKey] = useState(stores[0]?.key ?? "");
  const selectedStore = stores.find((store) => store.key === selectedKey) ?? stores[0];
  const hasIncompleteLocations = stores.some(
    (store) => !store.description || !store.address || !store.phone ||
      store.latitude === undefined || store.longitude === undefined,
  );

  return (
    <div className="space-y-6">
      {hasIncompleteLocations ? (
        <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          Some stores are missing locator details. Add the address, phone, description, latitude and longitude to their Store Custom Type in Merchant Center.
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section aria-label="Store locations" className="space-y-4">
        {stores.length > 0 ? stores.map((store) => (
          <article
            key={store.key}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
              store.key === selectedStore?.key ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedKey(store.key)}
              aria-pressed={store.key === selectedStore?.key}
              className="w-full text-left"
            >
              <span className="text-xl font-bold text-slate-900">{store.name}</span>
            </button>
            {store.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{store.description}</p> : null}
            {store.address ? (
              <p className="mt-4 flex gap-2 text-sm text-slate-600">
                <span aria-hidden="true">⌖</span>
                <span>{store.address}</span>
              </p>
            ) : null}
            {store.phone ? (
              <p className="mt-2 flex gap-2 text-sm text-slate-600">
                <span aria-hidden="true">☎</span>
                <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="hover:text-slate-950">
                  {store.phone}
                </a>
              </p>
            ) : null}
            <div className="mt-5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedKey(store.key)}
                aria-pressed={store.key === selectedStore?.key}
                className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
              >
                Show on map
              </button>
              <Link
                href={`/stores/${encodeURIComponent(store.key)}`}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Store details
              </Link>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No stores yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add a Store in Merchant Center to show it here.
            </p>
          </div>
        )}
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Selected store map">
          {selectedStore ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Selected location</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedStore.name}</h2>
                </div>
                {selectedStore.address ? <p className="max-w-56 text-right text-xs leading-5 text-slate-500">{selectedStore.address}</p> : null}
              </div>
              <StoreMap store={selectedStore} />
              {selectedStore.latitude !== undefined && selectedStore.longitude !== undefined ? (
                <p className="px-3 py-3 text-xs text-slate-500">
                  {selectedStore.latitude.toFixed(4)}, {selectedStore.longitude.toFixed(4)} · © OpenStreetMap contributors
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Store locations will appear on the map.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
