import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductByKey,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
} from "@/src/lib/commercetools/products";
import { getLocalizedValue } from "@/src/utils/localized";
import { ProductImagePanel } from "@/src/components/product/ProductImagePanel";
import { ProductDetailsPanel } from "@/src/components/product/ProductDetailsPanel";
import { RelatedProductsSlider } from "@/src/components/site/RelatedProductsSlider";

export default async function ProductDetailPage({
  params,
}: {
  params?: Promise<{ slug?: string }>;
}) {
  const route = (await params) ?? {};
  const slug = route.slug ?? "";
  const product =
    (await getProductByKey(slug)) ??
    (await getProductById(slug)) ??
    (await getProductBySlug(slug));

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-sm text-slate-500">
        <Link href="/products" className="font-medium text-slate-700">Products</Link>
        <span className="mx-2">/</span>
        <span>{getLocalizedValue(product.name)}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <ProductImagePanel
          image={product.image}
          name={getLocalizedValue(product.name)}
          labels={product.labels}
        />
        <ProductDetailsPanel product={product} />
      </div>
      <RelatedProductsSlider products={relatedProducts} />
    </div>
  );
}
