import { defineConfig } from "oxlint";

export default defineConfig({
	plugins: ["react"],
	rules: {
		"react/rules-of-hooks": "error",
		"react/exhaustive-deps": "error",
	},
});
