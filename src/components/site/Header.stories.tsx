import type { Meta, StoryObj } from "@storybook/nextjs";
import { SiteHeader } from "@/src/components/site/Header";
import { withStoreProviders } from "../../../.storybook/StorybookStoreProviders";

const meta = {
  title: "Storefront/Shared/Header",
  component: SiteHeader,
  decorators: [withStoreProviders],
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
