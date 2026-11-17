import { apiRoot, hasCtpCredentials } from "@/src/lib/commercetools/client";
import { getCurrentMarket } from "@/src/lib/market-server";
import { getLocalizedValue } from "@/src/utils/localized";

export type ProductCategory = {
  id: string;
  name: string;
  parentId?: string;
};

const fallbackCategories: ProductCategory[] = [
  { id: "new-arrivals", name: "New Arrivals" },
  { id: "furniture", name: "Furniture" },
  { id: "kitchen", name: "Kitchen" },
  { id: "home-decor", name: "Home Decor" },
];

export async function getProductCategories(): Promise<ProductCategory[]> {
  if (!hasCtpCredentials || !apiRoot) return fallbackCategories;

  const market = await getCurrentMarket();
  try {
    const response = await apiRoot.categories().get({ queryArgs: { limit: 500, sort: "createdAt asc" } }).execute();
    return response.body.results.map((category) => ({
      id: category.id,
      name: getLocalizedValue(category.name, market.locale),
      parentId: category.parent?.id,
    }));
  } catch (error) {
    console.error("Failed to load product categories from commercetools", error);
    return fallbackCategories;
  }
}

export function getTopLevelCategories(categories: ProductCategory[]) {
  return categories.filter((category) => !category.parentId);
}

export function getCategoryAndDescendantIds(categories: ProductCategory[], categoryId: string) {
  const ids = new Set([categoryId]);
  let added = true;

  while (added) {
    added = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        added = true;
      }
    }
  }

  return [...ids];
}
