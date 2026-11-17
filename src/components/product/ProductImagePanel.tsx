import Image from "next/image";
import { ProductLabelsOverlay } from "@/src/components/product/ProductLabelsOverlay";
import type { ProductLabelBadge } from "@/src/lib/product-labels";

export function ProductImagePanel({
  image,
  name,
  labels,
}: {
  image?: string;
  name: string;
  labels?: ProductLabelBadge[];
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
        {image ? <Image src={image} alt={name} fill className="object-cover" /> : null}
        <ProductLabelsOverlay labels={labels} />
      </div>
    </div>
  );
}
