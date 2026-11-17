import { NextResponse } from "next/server";
import { apiRoot, hasCtpCredentials } from "@/src/lib/commercetools/client";
import { searchProducts } from "@/src/lib/commercetools/products";
import { getLocalizedValue } from "@/src/utils/localized";
import { getCurrentMarket } from "@/src/lib/market-server";

function humanize(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function getCategorySuggestions(ids: string[], locale: string) {
  if (ids.length === 0 || !hasCtpCredentials || !apiRoot) {
    return ids.map((id) => ({ id, name: humanize(id) }));
  }

  try {
    const where = `id in (${ids.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(",")})`;
    const response = await apiRoot.categories().get({ queryArgs: { where, limit: ids.length } }).execute();
    const namesById = new Map(response.body.results.map((category) => [category.id, getLocalizedValue(category.name, locale)]));

    return ids.map((id) => ({ id, name: namesById.get(id) || humanize(id) }));
  } catch (error) {
    console.error("Failed to load search suggestion categories", error);
    return ids.map((id) => ({ id, name: humanize(id) }));
  }
}

export async function GET(request: Request) {
  const market = await getCurrentMarket();
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length === 0) {
    return NextResponse.json({ products: [], categories: [], brands: [], total: 0 });
  }

  const { results, total } = await searchProducts({ query, limit: 100 });
  const categoryIds: string[] = Array.from(new Set<string>(results.flatMap((product) => product.categories ?? []))).slice(0, 5);
  const categories = await getCategorySuggestions(categoryIds, market.locale);
  const brands = Array.from(new Set(results.flatMap((product) => (product.brand ? [product.brand] : []))))
    .slice(0, 5)
    .map((name) => ({ name }));

  return NextResponse.json({
    products: results.slice(0, 5).map((product) => ({
      id: product.id,
      name: getLocalizedValue(product.name, market.locale),
      slug: getLocalizedValue(product.slug, market.locale),
      image: product.image,
      price: product.price,
    })),
    categories,
    brands,
    total,
  });
}
