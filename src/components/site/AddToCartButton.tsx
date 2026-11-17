"use client";

import { useCart } from "@/src/components/site/CartProvider";
import type { ProductRecord } from "@/src/lib/commercetools/products";
import { getLocalizedValue } from "@/src/utils/localized";
import { Button } from "@/src/components/ui/Button";

export function AddToCartButton({ product }: { product: ProductRecord }) {
  const { addItem } = useCart();

  return (
    <Button
      type="button"
      onClick={() =>
        addItem({
          id: product.id,
          name: getLocalizedValue(product.name),
          slug: getLocalizedValue(product.slug) || product.id,
          image: product.image ?? "",
          price: product.price?.centAmount ?? 0,
          currency: product.price?.currencyCode ?? "USD",
        })
      }
      className="px-6"
    >
      Add to cart
    </Button>
  );
}
