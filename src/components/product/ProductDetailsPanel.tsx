import Link from "next/link";
import type { ProductRecord } from "@/src/lib/commercetools/products";
import { AddToCartButton } from "@/src/components/site/AddToCartButton";
import { WishlistButton } from "@/src/components/account/WishlistButton";
import { formatPrice } from "@/src/utils/price";
import { getLocalizedValue } from "@/src/utils/localized";

export function ProductDetailsPanel({ product }: { product: ProductRecord }) {
  const name = getLocalizedValue(product.name);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">NamNX</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">{name}</h1>
      </div>

      <p className="text-3xl font-bold text-slate-900">
        {product.price ? formatPrice(product.price.centAmount, product.price.currencyCode) : "Price on request"}
      </p>

      <p className="text-base leading-7 text-slate-600">
        {getLocalizedValue(product.description ?? { "en-US": "A premium product from the NamNX collection." })}
      </p>

      <div className="flex flex-wrap gap-3">
        <AddToCartButton product={product} />
        <WishlistButton productId={product.id} variantId={product.variantId} />
        <Link href="/products" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
          Continue shopping
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-bold text-slate-900">Details</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Material: premium natural finish</li>
          <li>• Free shipping over $250</li>
          <li>• 30-day returns</li>
        </ul>
      </div>
    </div>
  );
}
