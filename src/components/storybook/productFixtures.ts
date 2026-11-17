import type { ProductRecord } from "@/src/lib/commercetools/products";

export const sampleProduct: ProductRecord = {
  id: "storybook-product-1",
  key: "aurora-table-lamp",
  variantId: 1,
  name: { "en-US": "Aurora Table Lamp" },
  slug: { "en-US": "aurora-table-lamp" },
  description: {
    "en-US": "A warm, sculptural lamp designed for everyday spaces.",
  },
  image: "/globe.svg",
  price: { centAmount: 12900, currencyCode: "USD" },
  categories: ["lighting"],
  brand: "NamNX Studio",
};

export const sampleProducts: ProductRecord[] = [
  sampleProduct,
  {
    ...sampleProduct,
    id: "storybook-product-2",
    key: "stoneware-vase",
    name: { "en-US": "Stoneware Vase" },
    slug: { "en-US": "stoneware-vase" },
    price: { centAmount: 6800, currencyCode: "USD" },
  },
  {
    ...sampleProduct,
    id: "storybook-product-3",
    key: "linen-cushion",
    name: { "en-US": "Linen Cushion" },
    slug: { "en-US": "linen-cushion" },
    image: undefined,
    price: { centAmount: 4200, currencyCode: "USD" },
  },
  {
    ...sampleProduct,
    id: "storybook-product-4",
    key: "oak-side-table",
    name: { "en-US": "Oak Side Table" },
    slug: { "en-US": "oak-side-table" },
    price: { centAmount: 24500, currencyCode: "USD" },
  },
];
