import { describe, it, expect } from 'vitest';

describe('ExportMenu', () => {
	it('module imports successfully', async () => {
		// Simple smoke test to ensure the component can be imported
		const module = await import('./ExportMenu.svelte');
		expect(module).toBeDefined();
		expect(module.default).toBeDefined();
	});
});
