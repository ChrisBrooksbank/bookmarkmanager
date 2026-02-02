import { describe, it, expect } from 'vitest';
import Bookmarklet from './Bookmarklet.svelte';

describe('Bookmarklet', () => {
	it('module imports successfully', () => {
		expect(Bookmarklet).toBeDefined();
	});
});
