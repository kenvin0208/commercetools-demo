import type { Meta, StoryObj } from "@storybook/nextjs";
import { ProductGrid } from "@/src/components/site/ProductGrid";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";
import { sampleProducts } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Products/Product grid",
  component: ProductGrid,
  decorators: [withStoreProviders],
  args: { products: sampleProducts },
} satisfies Meta<typeof ProductGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourColumns: Story = { args: { columns: "four" } };
export const ThreeColumns: Story = { args: { columns: "three" } };
export const TwoColumns: Story = { args: { columns: "two" } };
