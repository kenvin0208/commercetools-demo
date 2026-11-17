import type { Meta, StoryObj } from "@storybook/nextjs";
import { OrderStatus } from "@/src/components/account/OrderDisplay";

const meta = {
  title: "Account/Orders/Status",
  component: OrderStatus,
} satisfies Meta<typeof OrderStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paid: Story = { args: { value: "Paid" } };
export const Shipped: Story = { args: { value: "Shipped" } };
export const Pending: Story = { args: { value: "Open" } };
export const Cancelled: Story = { args: { value: "Cancelled" } };
export const Unavailable: Story = { args: { value: undefined } };
