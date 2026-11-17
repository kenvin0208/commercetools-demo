import type { Meta, StoryObj } from "@storybook/nextjs";
import { ProductCard } from "@/src/components/site/ProductCard";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";
import { sampleProduct } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Products/Product card",
  component: ProductCard,
  decorators: [withStoreProviders],
  args: { product: sampleProduct },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImage: Story = {
  args: {
    product: { ...sampleProduct, image: undefined },
  },
};

export const PriceUnavailable: Story = {
  args: {
    product: { ...sampleProduct, price: undefined },
  },
};

export const WithProductLabels: Story = {
  args: {
    product: {
      ...sampleProduct,
      labels: [
        {
          id: "summer-sale",
          text: "Sale -20%",
          position: "top-left",
          customCss: "background: #dc2626; color: #ffffff; border-radius: 9999px;",
          priority: 10,
        },
        {
          id: "new-season",
          text: "New",
          position: "top-left",
          customCss: "background: #0f172a; color: #ffffff;",
          priority: 5,
        },
        {
          id: "free-shipping",
          text: "Free Shipping",
          position: "top-right",
          customCss: "background: #059669; color: #ffffff;",
          priority: 1,
        },
        {
          id: "limited-edition",
          text: "Limited",
          position: "bottom-left",
          customCss: "background: #d97706; color: #ffffff;",
          priority: 1,
        },
        {
          id: "bestseller",
          text: "Bestseller",
          position: "bottom-right",
          customCss: "background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;",
          priority: 1,
        },
      ],
    },
  },
};
