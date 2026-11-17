import type { Meta, StoryObj } from "@storybook/nextjs";
import { HomeHero } from "@/src/components/site/HomeHero";
import { sampleProducts } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Home/Hero",
  component: HomeHero,
  parameters: { layout: "fullscreen" },
  args: { products: sampleProducts },
} satisfies Meta<typeof HomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutProductImages: Story = {
  args: {
    products: sampleProducts.map((product) => ({ ...product, image: undefined })),
  },
};
