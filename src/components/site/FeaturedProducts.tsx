import Link from "next/link";
import type { ProductCardItem } from "@/src/components/site/ProductCard";
import { ProductGrid } from "@/src/components/site/ProductGrid";

export function FeaturedProducts({ products }: { products: ProductCardItem[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Featured</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Curated picks</h2>
        </div>
        <Link href="/products" className="text-sm font-semibold text-slate-700">
          View all products →
        </Link>
      </div>
      <ProductGrid products={products} columns="four" />
    </section>
  );
}
