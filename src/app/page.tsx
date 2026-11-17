import { getFeaturedProducts } from "@/src/lib/commercetools/products";
import { FeaturedProducts } from "@/src/components/site/FeaturedProducts";
import { HomeHero } from "@/src/components/site/HomeHero";

export default async function HomePage() {
  const products = await getFeaturedProducts(4);

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
      <HomeHero products={products} />
      <FeaturedProducts products={products} />
    </div>
  );
}
