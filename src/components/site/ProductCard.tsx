"use client";

import Link from "next/link";
import Image from "next/image";
import { getLocalizedValue } from "@/src/utils/localized";
import { formatPrice } from "@/src/utils/price";
import { CartAddButton } from "@/src/components/site/CartAddButton";

import { WishlistButton } from "@/src/components/account/WishlistButton";
import { ProductLabelsOverlay } from "@/src/components/product/ProductLabelsOverlay";
import type { ProductLabelBadge } from "@/src/lib/product-labels";

export type ProductCardItem = {
  id: string;
  key?: string;
  variantId?: number;
  name: Record<string, string>;
  slug: Record<string, string>;
  description?: Record<string, string>;
  image?: string;
  price?: {
    centAmount: number;
    currencyCode: string;
  };
  labels?: ProductLabelBadge[];
};

export function ProductCard({ product }: { product: ProductCardItem }) {
  const slug = getLocalizedValue(product.slug) || product.key || product.id;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/products/${encodeURIComponent(slug)}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-slate-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={getLocalizedValue(product.name)}
              fill
              className="object-contain transition group-hover:scale-105 mix-blend-multiply"
            />
          ) : null}
          <ProductLabelsOverlay labels={product.labels} />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">New arrival</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{getLocalizedValue(product.name)}</h3>
        </div>

        {product.price ? (
          <p className="text-lg font-bold text-slate-900">
            {formatPrice(product.price.centAmount, product.price.currencyCode)}
          </p>
        ) : null}

        <CartAddButton
          item={{
            id: product.id,
            name: getLocalizedValue(product.name),
            slug,
            image: product.image ?? "",
            price: product.price?.centAmount ?? 0,
            currency: product.price?.currencyCode ?? "USD",
          }}
          size="sm"
          className="w-full"
        />
        <WishlistButton productId={product.id} variantId={product.variantId} />
      </div>
    </article>
  );
}
