import type { Meta, StoryObj } from "@storybook/nextjs";
import { WishlistButton } from "@/src/components/account/WishlistButton";

const meta = {
  title: "Account/Wishlist button",
  component: WishlistButton,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/products/aurora-table-lamp" },
    },
  },
  args: { productId: "storybook-product-1", variantId: 1 },
} satisfies Meta<typeof WishlistButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
