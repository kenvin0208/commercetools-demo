import type { Meta, StoryObj } from "@storybook/nextjs";
import CartPage from "@/src/app/cart/page";
import type { CartItem } from "@/src/components/site/CartProvider";
import { StorybookStoreProviders } from "../../../.storybook/StorybookStoreProviders";

const sampleCartItems: CartItem[] = [
  {
    id: "storybook-cart-product-1",
    name: "Aurora Table Lamp",
    slug: "aurora-table-lamp",
    image: "/globe.svg",
    price: 12900,
    currency: "USD",
    quantity: 2,
  },
  {
    id: "storybook-cart-product-2",
    name: "Stoneware Vase",
    slug: "stoneware-vase",
    image: "",
    price: 6800,
    currency: "USD",
    quantity: 1,
  },
];

const meta = {
  title: "Storefront/Cart/Cart page",
  component: CartPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CartPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  loaders: [
    () => {
      localStorage.setItem("namnx-cart", JSON.stringify([]));
      return {};
    },
  ],
  render: () => (
    <StorybookStoreProviders key="empty">
      <CartPage />
    </StorybookStoreProviders>
  ),
};

export const WithItems: Story = {
  loaders: [
    () => {
      localStorage.setItem("namnx-cart", JSON.stringify(sampleCartItems));
      return {};
    },
  ],
  render: () => (
    <StorybookStoreProviders key="with-items">
      <CartPage />
    </StorybookStoreProviders>
  ),
};
