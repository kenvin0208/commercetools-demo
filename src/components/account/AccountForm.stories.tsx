import type { Meta, StoryObj } from "@storybook/nextjs";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field } from "@/src/components/account/Fields";
import type { ActionState } from "@/src/lib/account/validation";

const saveProfile = async (): Promise<ActionState> => ({});

const rejectProfile = async (): Promise<ActionState> => ({
  error: "Please correct the highlighted information.",
});

const saveWithSuccess = async (): Promise<ActionState> => ({
  success: "Your changes have been saved.",
});

const meta = {
  title: "Account/Forms/Account form",
  component: AccountForm,
  args: {
    action: saveProfile,
    submitLabel: "Save changes",
    children: (
      <>
        <Field label="Email address" name="email" type="email" defaultValue="shopper@example.com" required />
        <Field label="Phone number" name="phone" type="tel" defaultValue="+1 555 0100" />
      </>
    ),
  },
} satisfies Meta<typeof AccountForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ConfirmationBeforeSubmit: Story = {
  args: {
    confirmMessage: "Remove this saved address?",
    submitLabel: "Remove address",
    action: saveProfile,
  },
};

export const ValidationError: Story = {
  args: { action: rejectProfile },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
  },
};

export const Success: Story = {
  args: { action: saveWithSuccess },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
  },
};
