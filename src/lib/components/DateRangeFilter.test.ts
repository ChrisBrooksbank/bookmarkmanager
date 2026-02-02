import { describe, it, expect } from 'vitest';

describe('DateRangeFilter', () => {
	it('module imports successfully', async () => {
		// Simple smoke test to ensure the component can be imported
		const module = await import('./DateRangeFilter.svelte');
		expect(module).toBeDefined();
		expect(module.default).toBeDefined();
	});
});
