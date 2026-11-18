import type { Metadata } from "next";
import { StoreLocator } from "@/src/components/site/StoreLocator";
import { getStores } from "@/src/lib/commercetools/stores";

export const metadata: Metadata = {
  title: "Store locator | NamNX",
  description: "Find a NamNX store and view its location on the map.",
};

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Visit us</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Our stores</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Find your nearest store, get in touch with our team, and explore the location on the map.
        </p>
      </div>
      <StoreLocator stores={stores} />
    </div>
  );
}
