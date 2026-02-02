import { describe, it, expect } from 'vitest';

describe('SearchBar', () => {
	it('module imports successfully', async () => {
		// Simple smoke test to ensure the component can be imported
		const module = await import('./SearchBar.svelte');
		expect(module).toBeDefined();
		expect(module.default).toBeDefined();
	});
});
