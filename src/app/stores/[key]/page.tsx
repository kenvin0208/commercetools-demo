import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreMap } from "@/src/components/site/StoreMap";
import { getStores } from "@/src/lib/commercetools/stores";

export const metadata: Metadata = {
  title: "Store details | NamNX",
};

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const store = (await getStores()).find((item) => item.key === key);

  if (!store) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/stores" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <span aria-hidden="true">←</span> All stores
      </Link>

      <StoreMap store={store} />

      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Store details</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">{store.name}</h1>
        {store.phone ? (
          <p className="mt-5 text-base font-semibold text-slate-700">
            <span className="mr-2 text-slate-500">Phone</span>
            <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="hover:text-slate-950">
              {store.phone}
            </a>
          </p>
        ) : null}
        {store.address ? (
          <p className="mt-3 text-base leading-7 text-slate-700">
            <span className="mr-2 font-semibold text-slate-500">Address</span>
            {store.address}
          </p>
        ) : null}
        {store.description ? <p className="mt-5 text-base leading-7 text-slate-600">{store.description}</p> : null}
        {!store.phone || !store.address || !store.description ? (
          <p role="status" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            Some store details are not set. Add the address, phone and description to this Store in Merchant Center.
          </p>
        ) : null}
      </section>
    </div>
  );
}
