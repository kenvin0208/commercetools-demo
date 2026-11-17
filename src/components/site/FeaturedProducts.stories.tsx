import type { Meta, StoryObj } from "@storybook/nextjs";
import { FeaturedProducts } from "@/src/components/site/FeaturedProducts";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";
import { sampleProducts } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Home/Featured products",
  component: FeaturedProducts,
  decorators: [withStoreProviders],
  args: { products: sampleProducts },
} satisfies Meta<typeof FeaturedProducts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
