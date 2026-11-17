import Link from "next/link";
import { getLocalizedValue } from "@/src/utils/localized";
import type { ProductRecord } from "@/src/lib/commercetools/products";

export function HomeHero({ products }: { products: ProductRecord[] }) {
  return (
    <section className="overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-2xl">
      <div className="grid gap-10 px-6 py-10 md:grid-cols-2 md:px-10 lg:px-14">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Spring / Summer 2026
          </p>
          <h1 className="max-w-xl text-4xl font-black tracking-tight md:text-6xl">
            Thoughtful essentials for everyday rituals.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            Built for modern living with premium materials, useful design, and seamless commerce powered by commercetools.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/products" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">
              Shop now
            </Link>
            <Link href="/search?q=lamp" className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white">
              Browse bestsellers
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {products.slice(0, 2).map((product) => (
            <div key={product.id} className="overflow-hidden rounded-3xl bg-slate-800">
              {product.image ? (
                <img
                  src={product.image}
                  alt={getLocalizedValue(product.name) || "Product"}
                  className="h-72 w-full object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
