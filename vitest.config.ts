import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// e2e/ の *.spec.ts は Playwright で動かす
		include: ['src/**/*.test.ts'],
	},
});
