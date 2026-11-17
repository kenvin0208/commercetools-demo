import type { Meta, StoryObj } from "@storybook/nextjs";
import ProductCard from "@/src/components/product/ProductCard";

const meta = {
  title: "Legacy/Product card",
  component: ProductCard,
  args: {
    product: {
      name: { "en-US": "Legacy sample lamp" },
      masterVariant: {
        images: [{ url: "/globe.svg" }],
        prices: [{ value: { centAmount: 8600, currencyCode: "USD" } }],
      },
    },
  },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImageOrPrice: Story = {
  args: {
    product: { name: { "en-US": "Product without image or price" }, masterVariant: {} },
  },
};

export const WithProductLabels: Story = {
  args: {
    product: {
      name: { "en-US": "Legacy sample lamp" },
      masterVariant: {
        images: [{ url: "/globe.svg" }],
        prices: [{ value: { centAmount: 8600, currencyCode: "USD" } }],
      },
      labels: [
        {
          id: "hot-deal",
          text: "Hot",
          position: "top-right",
          customCss: "background: #ef4444; color: #ffffff; border-radius: 9999px;",
          priority: 10,
        },
        {
          id: "eco",
          text: "Eco",
          position: "bottom-left",
          customCss: "background: #16a34a; color: #ffffff;",
          priority: 5,
        },
      ],
    },
  },
};
