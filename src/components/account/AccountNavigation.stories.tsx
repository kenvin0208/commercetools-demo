import type { Meta, StoryObj } from "@storybook/nextjs";
import { AccountNavigation } from "@/src/components/account/AccountNavigation";

const meta = {
  title: "Account/Navigation",
  component: AccountNavigation,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/account/profile" },
    },
  },
} satisfies Meta<typeof AccountNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileSelected: Story = {};

export const OrdersSelected: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/account/orders" },
    },
  },
};
