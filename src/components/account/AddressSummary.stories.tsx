import type { Meta, StoryObj } from "@storybook/nextjs";
import { AddressSummary } from "@/src/components/account/AddressSummary";

const meta = {
  title: "Account/Address summary",
  component: AddressSummary,
  args: {
    address: {
      firstName: "Jamie",
      lastName: "Morgan",
      company: "NamNX",
      streetNumber: "120",
      streetName: "Market Street",
      additionalStreetInfo: "Suite 8",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
      phone: "+1 555 0100",
      email: "jamie@example.com",
    },
  },
} satisfies Meta<typeof AddressSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};
export const MissingAddress: Story = { args: { address: undefined } };
export const Minimal: Story = {
  args: { address: { country: "AU", city: "Sydney" } },
};
