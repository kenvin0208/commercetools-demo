import type { StoreLocation } from "@/src/lib/commercetools/stores";

export function StoreMap({ store }: { store: StoreLocation }) {
  if (store.latitude === undefined || store.longitude === undefined) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-100 px-6 text-center text-sm text-slate-500">
        Map coordinates have not been added for this store yet.
      </div>
    );
  }

  const bounds = [
    store.longitude - 0.015,
    store.latitude - 0.01,
    store.longitude + 0.015,
    store.latitude + 0.01,
  ].join(",");
  const query = new URLSearchParams({
    bbox: bounds,
    layer: "mapnik",
    marker: `${store.latitude},${store.longitude}`,
  });

  return (
    <iframe
      title={`Map showing ${store.name}`}
      src={`https://www.openstreetmap.org/export/embed.html?${query.toString()}`}
      loading="lazy"
      className="h-80 w-full rounded-2xl border-0 bg-slate-100 sm:h-[26rem]"
    />
  );
}
