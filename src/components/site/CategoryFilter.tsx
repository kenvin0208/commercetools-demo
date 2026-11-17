import Link from "next/link";

type CategoryItem = { id: string; name: string };

type Props = {
  categories: CategoryItem[];
  selectedCategory: string;
  totalProducts: number;
  productCountsByCategory: Record<string, number>;
  hrefForCategory: (categoryId: string) => string;
};

export function CategoryFilter({
  categories,
  selectedCategory,
  totalProducts,
  productCountsByCategory,
  hrefForCategory,
}: Props) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Filters</h2>
      <div className="mt-4 space-y-4 text-sm text-slate-600">
        <div>
          <p className="mb-2 font-semibold text-slate-900">Categories</p>
          <div className="space-y-2">
            {[{ id: "", name: "All products" }, ...categories].map((item) => (
              <Link
                key={item.id}
                href={hrefForCategory(item.id)}
                className={
                  item.id === selectedCategory
                    ? "block w-max max-w-full font-semibold text-slate-900"
                    : "block w-max max-w-full text-slate-600"
                }
                aria-current={item.id === selectedCategory ? "page" : undefined}
              >
                {item.name} ({item.id ? productCountsByCategory[item.id] ?? 0 : totalProducts})
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
