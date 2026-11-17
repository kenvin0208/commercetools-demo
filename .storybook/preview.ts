import type { Preview } from "@storybook/nextjs";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;
