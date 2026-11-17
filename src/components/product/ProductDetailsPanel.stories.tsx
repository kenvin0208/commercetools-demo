import type { Meta, StoryObj } from "@storybook/nextjs";
import { ProductDetailsPanel } from "@/src/components/product/ProductDetailsPanel";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";
import { sampleProduct } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Products/Product details",
  component: ProductDetailsPanel,
  decorators: [withStoreProviders],
  args: { product: sampleProduct },
} satisfies Meta<typeof ProductDetailsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PriceOnRequest: Story = {
  args: { product: { ...sampleProduct, price: undefined } },
};
