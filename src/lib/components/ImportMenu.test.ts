import { describe, it, expect } from 'vitest';

describe('ImportMenu', () => {
	it('module imports successfully', async () => {
		const module = await import('./ImportMenu.svelte');
		expect(module.default).toBeDefined();
	});
});
