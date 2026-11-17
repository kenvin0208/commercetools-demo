import { apiRoot, hasCtpCredentials } from "@/src/lib/commercetools/client";
import { DEFAULT_CURRENCY } from "@/src/constants";
import { getLocalizedValue } from "@/src/utils/localized";
import { getCurrentMarket } from "@/src/lib/market-server";
import type { Market } from "@/src/lib/market";
import { getProductLabels } from "@/src/lib/commercetools/product-labels";
import {
  resolveLabelsForProduct,
  type ProductAttributeEntry,
  type ProductLabelBadge,
  type ProductLabelConfig,
} from "@/src/lib/product-labels";

export type ProductRecord = {
  id: string;
  key?: string;
  variantId: number;
  relatedProductReferences?: { id?: string; key?: string }[];
  name: Record<string, string>;
  slug: Record<string, string>;
  description?: Record<string, string>;
  image?: string;
  price?: {
    centAmount: number;
    currencyCode: string;
    fractionDigits?: number;
  };
  categories?: string[];
  brand?: string;
  attributes?: ProductAttributeEntry[];
  labels?: ProductLabelBadge[];
};

const fallbackProducts: ProductRecord[] = [
  {
    id: "prod-aurora",
    key: "aurora-lamp",
    variantId: 1,
    name: { "en-US": "Aurora Lamp" },
    slug: { "en-US": "aurora-lamp" },
    description: { "en-US": "Ambient lighting for modern homes." },
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    price: { centAmount: 12900, currencyCode: DEFAULT_CURRENCY },
    categories: ["lighting"],
    brand: "Lumina",
  },
  {
    id: "prod-stone",
    key: "stone-chair",
    variantId: 1,
    name: { "en-US": "Stone Chair" },
    slug: { "en-US": "stone-chair" },
    description: { "en-US": "Minimal lounge seating with a sculptural silhouette." },
    image: "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=900&q=80",
    price: { centAmount: 24500, currencyCode: DEFAULT_CURRENCY },
    categories: ["furniture"],
    brand: "Forma",
  },
  {
    id: "prod-tide",
    key: "tide-vase",
    variantId: 1,
    name: { "en-US": "Tide Vase" },
    slug: { "en-US": "tide-vase" },
    description: { "en-US": "Handmade ceramic decor with soft natural tones." },
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
    price: { centAmount: 9600, currencyCode: DEFAULT_CURRENCY },
    categories: ["decor"],
    brand: "Atelier",
  },
  {
    id: "prod-noir",
    key: "noir-cup",
    variantId: 1,
    name: { "en-US": "Noir Cup" },
    slug: { "en-US": "noir-cup" },
    description: { "en-US": "Smooth matte ceramic cup for daily rituals." },
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80",
    price: { centAmount: 3200, currencyCode: DEFAULT_CURRENCY },
    categories: ["kitchen"],
    brand: "Atelier",
  },
];

type RawPrice = { value?: { currencyCode?: string; centAmount?: number; fractionDigits?: number }; currencyCode?: string; centAmount?: number; fractionDigits?: number };
type RawProduct = {
  id?: string;
  key?: string;
  masterData?: { current?: RawProduct };
  masterVariant?: { id?: number; prices?: RawPrice[]; attributes?: { name?: string; value?: unknown }[]; images?: { url?: string }[] };
  variants?: RawProduct["masterVariant"][];
  attributes?: { name?: string; value?: unknown }[];
  name?: Record<string, string>;
  slug?: Record<string, string>;
  description?: Record<string, string>;
  image?: { url?: string };
  categories?: { id?: string }[];
};

function normalizeProduct(
  product: RawProduct,
  market: Market,
  labelConfigs: ProductLabelConfig[] = [],
): ProductRecord {
  const current = product?.masterData?.current ?? product;
  const variant = current?.masterVariant ?? product?.masterVariant ?? product?.variants?.[0] ?? {};
  const prices = Array.isArray(variant.prices) ? variant.prices : [];
  const price =
    prices.find((entry) => entry.value?.currencyCode === market.currency) ??
    prices.find((entry) => entry.currencyCode === market.currency) ??
    null;

  const normalizedPrice = price?.value ?? price;
  const attributes: { name?: string; value?: unknown }[] = Array.isArray(variant.attributes) ? variant.attributes : [];
  const brandAttribute = attributes.find((attribute) => attribute.name?.toLowerCase() === "brand");
  const brandValue = brandAttribute?.value;
  const brandOption = typeof brandValue === "object" && brandValue !== null ? (brandValue as { label?: unknown; key?: unknown }) : undefined;
  const brand =
    typeof brandValue === "string"
      ? brandValue
      : typeof brandOption?.label === "string"
        ? brandOption.label
        : typeof brandOption?.key === "string"
          ? brandOption.key
          : undefined;
  const currentAttributes = Array.isArray(current?.attributes) ? current.attributes : [];
  const productAttributes = Array.isArray(product.attributes) ? product.attributes : [];
  const combinedRawAttributes = [...productAttributes, ...currentAttributes, ...attributes];
  const normalizedAttributes: ProductAttributeEntry[] = combinedRawAttributes
    .filter((attribute): attribute is { name: string; value?: unknown } => typeof attribute.name === "string" && attribute.name.trim().length > 0)
    .map((attribute) => ({ name: attribute.name, value: attribute.value }));
  const relatedValue = combinedRawAttributes.find((attribute) => {
    const name = attribute.name?.toLowerCase();
    return name === "related_product" || name === "related_products";
  })?.value;
  const relatedValues = Array.isArray(relatedValue) ? relatedValue : relatedValue ? [relatedValue] : [];
  const relatedProductReferences = relatedValues.flatMap((value) => {
    if (typeof value !== "object" || value === null) {
      return [];
    }

    const reference = value as { id?: unknown; key?: unknown; typeId?: unknown };
    if (reference.typeId && reference.typeId !== "product") {
      return [];
    }

    const id = typeof reference.id === "string" ? reference.id : undefined;
    const key = typeof reference.key === "string" ? reference.key : undefined;
    return id || key ? [{ id, key }] : [];
  });

  const id = product?.id ?? current?.id ?? "demo-product";
  const key = product?.key ?? current?.key;
  const labels = resolveLabelsForProduct(labelConfigs, {
    id,
    key,
    brand,
    attributes: normalizedAttributes,
  });

  return {
    id,
    key,
    variantId: variant.id ?? 1,
    relatedProductReferences,
    name: current?.name ?? product?.name ?? { [market.locale]: "Demo product" },
    slug: current?.slug ?? product?.slug ?? { [market.locale]: product?.id ?? "demo-product" },
    description: current?.description ?? product?.description ?? { [market.locale]: "A modern product from the NamNX collection." },
    image:
      variant.images?.[0]?.url ??
      product?.image?.url ??
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    price: normalizedPrice
      ? {
          centAmount: normalizedPrice.centAmount ?? 0,
          currencyCode: normalizedPrice.currencyCode ?? market.currency,
          fractionDigits: normalizedPrice.fractionDigits ?? 2,
        }
      : { centAmount: 0, currencyCode: market.currency },
    categories: current?.categories?.map((category) => category.id).filter((id): id is string => Boolean(id)) ?? [],
    brand,
    attributes: normalizedAttributes,
    labels,
  };
}

export async function getFeaturedProducts(limit = 4): Promise<ProductRecord[]> {
  const market = await getCurrentMarket();
  if (!hasCtpCredentials || !apiRoot) {
    return fallbackProducts.slice(0, limit).map((product) => ({ ...product, price: product.price ? { ...product.price, currencyCode: market.currency } : undefined }));
  }

  try {
    const queryArgs = {
      limit,
      staged: false,
      sort: `name.${market.locale} asc`,
      priceCurrency: market.currency,
      priceCountry: market.country,
    };
    const [response, labelConfigs] = await Promise.all([
      apiRoot.productProjections().get({ queryArgs: { ...queryArgs, ...(market.storeKey ? { storeProjection: market.storeKey } : {}) } }).execute(),
      getProductLabels(),
    ]);

    return (response.body.results ?? []).map((product) => normalizeProduct(product as RawProduct, market, labelConfigs));
  } catch (error) {
    console.error("Failed to load featured products from commercetools", error);
    return [];
  }
}

export async function searchProducts({
  query = "",
  category,
  facet,
  limit = 12,
  offset = 0,
}: {
  query?: string;
  category?: string | string[];
  facet?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const market = await getCurrentMarket();
  const categoryIds = Array.isArray(category) ? category : category ? [category] : [];
  if (!hasCtpCredentials || !apiRoot) {
    const filtered = fallbackProducts.filter((product) => {
      const normalizedQuery = query.toLowerCase();
      const matchesQuery =
        !query ||
        getLocalizedValue(product.name, market.locale).toLowerCase().includes(normalizedQuery) ||
        product.brand?.toLowerCase().includes(normalizedQuery);
      const matchesCategory = categoryIds.length === 0 || product.categories?.some((id) => categoryIds.includes(id));
      const matchesFacet = !facet || product.name[market.locale]?.toLowerCase().includes(facet.toLowerCase());
      return matchesQuery && matchesCategory && matchesFacet;
    });

    return {
      results: filtered.slice(offset, offset + limit),
      total: filtered.length,
      facets: {},
    };
  }

  try {
    const queryArgs = {
      limit,
      offset,
      staged: false,
      sort: `name.${market.locale} asc`,
      priceCurrency: market.currency,
      priceCountry: market.country,
      ...(categoryIds.length > 0 ? { where: `categories(id in (${categoryIds.map((id) => `"${id}"`).join(",")}))` } : {}),
    };
    const [response, labelConfigs] = await Promise.all([
      apiRoot.productProjections().get({ queryArgs: { ...queryArgs, ...(market.storeKey ? { storeProjection: market.storeKey } : {}) } }).execute(),
      getProductLabels(),
    ]);

    const results = (response.body.results ?? []).map((product) => normalizeProduct(product as RawProduct, market, labelConfigs));
    const filtered = results.filter((product) => {
      const productName = getLocalizedValue(product.name, market.locale).toLowerCase();
      const normalizedQuery = query.toLowerCase();
      const matchesQuery = !query || productName.includes(normalizedQuery) || product.brand?.toLowerCase().includes(normalizedQuery);
      const matchesCategory = categoryIds.length === 0 || product.categories?.some((id) => categoryIds.includes(id));
      return matchesQuery && matchesCategory;
    });

    return {
      results: filtered,
      total: response.body.total ?? filtered.length,
      facets: {},
    };
  } catch (error) {
    console.error("Product search failed against commercetools", error);
    return {
      results: [],
      total: 0,
      facets: {},
    };
  }
}

export async function getProductByKey(key: string): Promise<ProductRecord | null> {
  const market = await getCurrentMarket();
  if (!hasCtpCredentials || !apiRoot) {
    const product = fallbackProducts.find((entry) => entry.key === key);
    return product ? { ...product, price: product.price ? { ...product.price, currencyCode: market.currency } : undefined } : null;
  }

  try {
    const [response, labelConfigs] = await Promise.all([
      (market.storeKey ? apiRoot.inStoreKeyWithStoreKeyValue({ storeKey: market.storeKey }).productProjections() : apiRoot.productProjections()).withKey({ key }).get({ queryArgs: { staged: false, priceCurrency: market.currency, priceCountry: market.country } }).execute(),
      getProductLabels(),
    ]);
    return normalizeProduct(response.body, market, labelConfigs);
  } catch (error) {
    console.error("Failed to load product by key from commercetools", error);
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  const market = await getCurrentMarket();
  if (!hasCtpCredentials || !apiRoot) {
    const product = fallbackProducts.find((entry) => Object.values(entry.slug).includes(slug));
    return product ? { ...product, price: product.price ? { ...product.price, currencyCode: market.currency } : undefined } : null;
  }

  try {
    const queryArgs = {
          staged: false,
          priceCurrency: market.currency,
          priceCountry: market.country,
          where: `slug(${market.locale}="${slug}")`,
          limit: 1,
        };
    const [response, labelConfigs] = await Promise.all([
      apiRoot.productProjections().get({ queryArgs: { ...queryArgs, ...(market.storeKey ? { storeProjection: market.storeKey } : {}) } }).execute(),
      getProductLabels(),
    ]);

    const product = response.body.results?.[0];

    return product ? normalizeProduct(product, market, labelConfigs) : null;
  } catch (error) {
    console.error("Failed to load product by slug from commercetools", error);
    return null;
  }
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  const market = await getCurrentMarket();
  if (!hasCtpCredentials || !apiRoot) {
    const product = fallbackProducts.find((entry) => entry.id === id);
    return product ? { ...product, price: product.price ? { ...product.price, currencyCode: market.currency } : undefined } : null;
  }

  try {
    const [response, labelConfigs] = await Promise.all([
      (market.storeKey ? apiRoot.inStoreKeyWithStoreKeyValue({ storeKey: market.storeKey }).productProjections() : apiRoot.productProjections()).withId({ ID: id }).get({ queryArgs: { staged: false, priceCurrency: market.currency, priceCountry: market.country } }).execute(),
      getProductLabels(),
    ]);
    return normalizeProduct(response.body, market, labelConfigs);
  } catch (error) {
    console.error("Failed to load product by id from commercetools", error);
    return null;
  }
}

export async function getRelatedProducts(product: ProductRecord): Promise<ProductRecord[]> {
  const references = product.relatedProductReferences ?? [];
  const uniqueReferences = references.filter(
    (reference, index) =>
      references.findIndex((entry) => (entry.id && entry.id === reference.id) || (entry.key && entry.key === reference.key)) === index,
  );

  const products = await Promise.all(
    uniqueReferences.map((reference) =>
      reference.id ? getProductById(reference.id) : reference.key ? getProductByKey(reference.key) : null,
    ),
  );

  return products.filter((related): related is ProductRecord => related !== null && related.id !== product.id);
}
