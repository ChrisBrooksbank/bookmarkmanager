import { describe, it, expect } from 'vitest';

describe('BulkDeleteButton', () => {
	it('module imports successfully', async () => {
		// Simple smoke test to ensure the component can be imported
		const module = await import('./BulkDeleteButton.svelte');
		expect(module).toBeDefined();
		expect(module.default).toBeDefined();
	});
});
