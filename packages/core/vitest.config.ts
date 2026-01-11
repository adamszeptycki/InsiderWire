import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tsconfigPaths({
			loose: true,
		}),
	],
	test: {
		env: {
			DATABASE_URL: "postgresql://postgres:@localhost:5938/kensaku-test",
		},
		include: ["**/*.test.ts"],
		globals: true,
		testTimeout: 500000,
		setupFiles: ["./setupVitest.ts"],
		passWithNoTests: true,
	},
});
