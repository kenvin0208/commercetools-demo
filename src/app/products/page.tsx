import Link from "next/link";
import { searchProducts } from "@/src/lib/commercetools/products";
import { getCategoryAndDescendantIds, getProductCategories, getTopLevelCategories } from "@/src/lib/commercetools/categories";
import { CategoryFilter } from "@/src/components/site/CategoryFilter";
import { ProductGrid } from "@/src/components/site/ProductGrid";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.q ?? "";
  const category = params.category ?? "";
  const page = Number(params.page ?? "1") || 1;
  const categories = await getProductCategories();
  const topLevelCategories = getTopLevelCategories(categories);
  const categoryIds = category ? getCategoryAndDescendantIds(categories, category) : [];
  const [data, allProducts, categoryCounts] = await Promise.all([
    searchProducts({ query, category: categoryIds, limit: 12, offset: (page - 1) * 12 }),
    searchProducts({ limit: 1 }),
    Promise.all(
      topLevelCategories.map(async (item) => [
        item.id,
        (await searchProducts({ category: getCategoryAndDescendantIds(categories, item.id), limit: 1 })).total,
      ] as const),
    ),
  ]);
  const productCountsByCategory = Object.fromEntries(categoryCounts);
  const productHref = (nextCategory = category, nextPage = 1) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (nextCategory) nextParams.set("category", nextCategory);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    const search = nextParams.toString();
    return search ? `/products?${search}` : "/products";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Shop</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Products</h1>
        </div>

        <form method="get" action="/products" className="flex gap-3">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search products"
            className="w-72 rounded-full bg-white py-2"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <CategoryFilter
          categories={topLevelCategories}
          selectedCategory={category}
          totalProducts={allProducts.total}
          productCountsByCategory={productCountsByCategory}
          hrefForCategory={(nextCategory) => productHref(nextCategory)}
        />

        <section className="space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>{data.total} items</p>
            <p>{query ? `Results for “${query}”` : "All products"}</p>
          </div>

          <ProductGrid products={data.results} columns="three" />

          <div className="flex justify-between pt-4">
            <Link href={productHref(category, Math.max(1, page - 1))} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Previous
            </Link>
            <Link href={productHref(category, page + 1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Next
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
