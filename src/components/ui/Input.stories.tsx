import type { Meta, StoryObj } from "@storybook/nextjs";
import { Input } from "./Input";

const meta = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Email address",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = {
  args: { required: true, placeholder: "Required field" },
};
export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    "aria-describedby": "email-error",
    type: "email",
    defaultValue: "not-an-email",
  },
  render: (args) => (
    <div className="w-80 space-y-2">
      <Input {...args} />
      <p id="email-error" className="text-sm text-red-700">
        Enter a valid email address.
      </p>
    </div>
  ),
};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Unavailable input" },
};
