"use client";

import type { ProductRecord } from "@/src/lib/commercetools/products";
import { getLocalizedValue } from "@/src/utils/localized";
import { CartAddButton } from "@/src/components/site/CartAddButton";

export function AddToCartButton({ product }: { product: ProductRecord }) {
  return (
    <CartAddButton
      item={{
        id: product.id,
        name: getLocalizedValue(product.name),
        slug: getLocalizedValue(product.slug) || product.id,
        image: product.image ?? "",
        price: product.price?.centAmount ?? 0,
        currency: product.price?.currencyCode ?? "USD",
      }}
      className="px-6"
    />
  );
}
