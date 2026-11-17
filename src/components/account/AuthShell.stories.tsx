import type { Meta, StoryObj } from "@storybook/nextjs";
import { AuthShell } from "@/src/components/account/AuthShell";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field } from "@/src/components/account/Fields";
import type { ActionState } from "@/src/lib/account/validation";

const signIn = async (): Promise<ActionState> => ({});

const meta = {
  title: "Account/Auth/Auth shell",
  component: AuthShell,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Welcome back",
    description: "Sign in to your NamNX account.",
    children: (
      <AccountForm action={signIn} submitLabel="Sign in">
        <Field label="Email address" type="email" name="email" defaultValue="shopper@example.com" required />
        <Field label="Password" type="password" name="password" defaultValue="password" required />
      </AccountForm>
    ),
  },
} satisfies Meta<typeof AuthShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {};

export const CreateAccount: Story = {
  args: {
    title: "Create your account",
    description: "Join NamNX to keep your details and orders together.",
  },
};
