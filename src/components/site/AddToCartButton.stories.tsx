import type { Meta, StoryObj } from "@storybook/nextjs";
import { AddToCartButton } from "@/src/components/site/AddToCartButton";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";
import { sampleProduct } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Cart/Add to cart button",
  component: AddToCartButton,
  decorators: [withStoreProviders],
  args: { product: sampleProduct },
} satisfies Meta<typeof AddToCartButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PriceUnavailable: Story = {
  args: {
    product: { ...sampleProduct, price: undefined },
  },
};
