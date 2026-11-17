import type { Meta, StoryObj } from "@storybook/nextjs";
import { CategoryFilter } from "@/src/components/site/CategoryFilter";

const meta = {
  title: "Storefront/Products/Category filter",
  component: CategoryFilter,
  args: {
    categories: [
      { id: "lighting", name: "Lighting" },
      { id: "furniture", name: "Furniture" },
      { id: "decor", name: "Home decor" },
    ],
    selectedCategory: "",
    totalProducts: 42,
    productCountsByCategory: { lighting: 12, furniture: 18, decor: 12 },
    hrefForCategory: (categoryId: string) =>
      categoryId ? `/products?category=${categoryId}` : "/products",
  },
} satisfies Meta<typeof CategoryFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllProducts: Story = {};
export const CategorySelected: Story = {
  args: { selectedCategory: "lighting" },
};
