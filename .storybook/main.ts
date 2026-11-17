import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";

const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/nextjs",
  staticDirs: ["../public"],
  webpackFinal: async (webpackConfig) => {
    webpackConfig.resolve ??= {};
    const accountActionsMock = path.resolve(
      process.cwd(),
      ".storybook/mocks/account-actions.ts",
    );
    webpackConfig.plugins?.push({
      apply(compiler) {
        compiler.hooks.normalModuleFactory.tap("StorybookAccountActionMock", (factory) => {
          factory.hooks.beforeResolve.tap("StorybookAccountActionMock", (data) => {
            if (data?.request === "@/src/lib/account/actions") {
              data.request = accountActionsMock;
            }
          });
        });
      },
    });
    return webpackConfig;
  },
};

export default config;
