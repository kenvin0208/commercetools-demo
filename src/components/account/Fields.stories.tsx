import type { Meta, StoryObj } from "@storybook/nextjs";
import { AddressFields, Field, NameFields, NewPasswordFields } from "@/src/components/account/Fields";

const meta = {
  title: "Account/Forms/Fields",
  component: Field,
  args: { label: "Email address", name: "email", type: "email", placeholder: "you@example.com" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleField: Story = {};

export const NameFieldsGroup: Story = {
  render: () => (
    <form className="w-full max-w-2xl rounded-2xl bg-white p-6">
      <NameFields firstName="Jamie" lastName="Morgan" />
    </form>
  ),
};

export const AddressFieldsGroup: Story = {
  render: () => (
    <form className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6">
      <AddressFields
        address={{
          firstName: "Jamie",
          lastName: "Morgan",
          streetName: "Market Street",
          streetNumber: "120",
          city: "San Francisco",
          state: "CA",
          postalCode: "94105",
          country: "US",
          phone: "+1 555 0100",
        }}
      />
    </form>
  ),
};

export const AddressFieldsWithoutName: Story = {
  render: () => (
    <form className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6">
      <AddressFields includeName={false} address={{ country: "AU" }} />
    </form>
  ),
};

export const PasswordFields: Story = {
  render: () => (
    <form className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6">
      <NewPasswordFields />
    </form>
  ),
};
