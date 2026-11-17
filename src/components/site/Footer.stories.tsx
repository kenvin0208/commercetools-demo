import type { Meta, StoryObj } from "@storybook/nextjs";
import { SiteFooter } from "@/src/components/site/Footer";

const meta = {
  title: "Storefront/Shared/Footer",
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
