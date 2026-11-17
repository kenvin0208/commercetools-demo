import { getLocalizedValue } from "@/src/utils/localized";
import { formatPrice } from "@/src/utils/price";
import Image from "next/image";
import { ProductLabelsOverlay } from "@/src/components/product/ProductLabelsOverlay";
import type { ProductLabelBadge } from "@/src/lib/product-labels";

type Props = {
  product: {
    name?: Record<string, string>;
    labels?: ProductLabelBadge[];
    masterVariant?: {
      images?: { url: string }[];
      prices?: { value: { centAmount: number; currencyCode: string } }[];
    };
  };
  labels?: ProductLabelBadge[];
};

export default function ProductCard({ product, labels }: Props) {
  const variant = product.masterVariant;

  const image = variant?.images?.[0];

  const price = variant?.prices?.[0];

  return (
    <div className="rounded-lg border overflow-hidden hover:shadow-lg transition">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image && (
          <Image
            src={image.url}
            alt={getLocalizedValue(product.name)}
            width={600}
            height={600}
            className="h-full w-full object-cover"
          />
        )}
        <ProductLabelsOverlay labels={labels ?? product.labels} />
      </div>

      <div className="p-4">
        <h2 className="font-semibold">{getLocalizedValue(product.name)}</h2>

        {price && (
          <p className="mt-2 font-bold">
            {formatPrice(price.value.centAmount, price.value.currencyCode)}
          </p>
        )}
      </div>
    </div>
  );
}
