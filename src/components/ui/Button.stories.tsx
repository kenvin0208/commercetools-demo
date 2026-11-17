import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Add to cart",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "sm",
  },
};
export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};
export const Ghost: Story = {
  args: { variant: "ghost", children: "More options" },
};
export const Danger: Story = {
  args: { variant: "danger", children: "Remove" },
};
export const Icon: Story = {
  args: { size: "icon", children: "+", "aria-label": "Increase quantity" },
};
export const Disabled: Story = {
  args: { disabled: true, children: "Unavailable" },
};
