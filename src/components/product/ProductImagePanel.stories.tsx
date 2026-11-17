import type { Meta, StoryObj } from "@storybook/nextjs";
import { ProductImagePanel } from "@/src/components/product/ProductImagePanel";

const meta = {
  title: "Storefront/Products/Product image",
  component: ProductImagePanel,
  args: { image: "/globe.svg", name: "Aurora Table Lamp" },
} satisfies Meta<typeof ProductImagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {};
export const WithoutImage: Story = { args: { image: undefined } };
export const WithProductLabels: Story = {
  args: {
    labels: [
      {
        id: "summer-sale",
        text: "Sale -20%",
        position: "top-left",
        customCss: "background: #dc2626; color: #ffffff; border-radius: 9999px;",
        priority: 10,
      },
      {
        id: "free-shipping",
        text: "Free Shipping",
        position: "top-right",
        customCss: "background: #059669; color: #ffffff;",
        priority: 5,
      },
      {
        id: "bestseller",
        text: "Bestseller",
        position: "bottom-right",
        customCss: "background: #0f172a; color: #ffffff;",
        priority: 1,
      },
    ],
  },
};
