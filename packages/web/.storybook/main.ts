import type { StorybookConfig } from "@storybook/nextjs";
import path from "path";

const config: StorybookConfig = {
	stories: [
		"../src/**/*.mdx",
		"../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
	],
	framework: {
		name: "@storybook/nextjs",
		options: {
			builder: {
				useSWC: true,
			},
		},
	},
	staticDirs: ["../public"],
	webpackFinal: async (config) => {
		// Disable webpack cache to avoid issues with Next.js 15
		if (config.cache) {
			config.cache = false;
		}
		return config;
	},
};

export default config;
