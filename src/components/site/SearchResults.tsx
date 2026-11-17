import Link from "next/link";
import type { ProductCardItem } from "@/src/components/site/ProductCard";
import { ProductGrid } from "@/src/components/site/ProductGrid";

type Props = {
  products: ProductCardItem[];
  query: string;
  total: number;
};

export function SearchResults({ products, query, total }: Props) {
  return (
    <div className="mt-10">
      {query ? (
        <div className="mb-6 text-sm text-slate-600">
          {total} results for “{query}”
        </div>
      ) : null}

      <ProductGrid products={products} columns="four" />

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">
            No products matched your search.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            View all products
          </Link>
        </div>
      ) : null}
    </div>
  );
}
