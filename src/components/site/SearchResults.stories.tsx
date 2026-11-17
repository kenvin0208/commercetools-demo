import type { Meta, StoryObj } from "@storybook/nextjs";
import { SearchResults } from "@/src/components/site/SearchResults";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";
import { sampleProducts } from "@/src/components/storybook/productFixtures";

const meta = {
  title: "Storefront/Search/Results",
  component: SearchResults,
  decorators: [withStoreProviders],
  args: { products: sampleProducts, query: "lamp", total: 8 },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MatchingProducts: Story = {};
export const NoMatches: Story = {
  args: { products: [], query: "unavailable item", total: 0 },
};
export const BeforeSearch: Story = {
  args: { products: sampleProducts, query: "", total: 4 },
};
