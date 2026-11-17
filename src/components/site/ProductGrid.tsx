import type { ProductCardItem } from "@/src/components/site/ProductCard";
import { ProductCard } from "@/src/components/site/ProductCard";

type Props = {
  products: ProductCardItem[];
  columns?: "two" | "three" | "four";
};

const columnClasses = {
  two: "md:grid-cols-2",
  three: "md:grid-cols-2 xl:grid-cols-3",
  four: "md:grid-cols-2 xl:grid-cols-4",
};

export function ProductGrid({ products, columns = "four" }: Props) {
  return (
    <div className={`grid gap-6 ${columnClasses[columns]}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
