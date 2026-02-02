import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { tagsStore } from '$lib/stores/tags.svelte';
import { tags as db, clearAllData } from '$lib/db';
import type { Tag } from '$lib/types';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock
});

// Helper to create a test tag
function createTestTag(overrides?: Partial<Tag>): Tag {
	return {
		id: `tag-${Math.random().toString(36).substr(2, 9)}`,
		name: 'Test Tag',
		color: '#FF5733',
		...overrides
	};
}

describe('tagsStore', () => {
	beforeEach(async () => {
		// Clear IndexedDB and localStorage before each test
		await clearAllData();
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('load', () => {
		it('should load tags from IndexedDB', async () => {
			const tag = createTestTag();
			await db.add(tag);

			await tagsStore.load();

			expect(tagsStore.items).toHaveLength(1);
			expect(tagsStore.items[0]).toEqual(tag);
			expect(tagsStore.loading).toBe(false);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const tag = createTestTag();
			localStorageMock.setItem('tags-fallback', JSON.stringify([tag]));

			// Mock IndexedDB to fail
			vi.spyOn(db, 'getAll').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await tagsStore.load();

			expect(tagsStore.items).toHaveLength(1);
			expect(tagsStore.items[0]).toEqual(tag);
			expect(tagsStore.error).toBeTruthy();
		});

		it('should return empty array when both IndexedDB and localStorage fail', async () => {
			vi.spyOn(db, 'getAll').mockRejectedValueOnce(new Error('IndexedDB failed'));
			vi.spyOn(localStorageMock, 'getItem').mockImplementationOnce(() => {
				throw new Error('localStorage failed');
			});

			await tagsStore.load();

			expect(tagsStore.items).toHaveLength(0);
		});
	});

	describe('add', () => {
		it('should add a tag to IndexedDB', async () => {
			await tagsStore.load();
			const tag = createTestTag();

			await tagsStore.add(tag);

			expect(tagsStore.items).toHaveLength(1);
			expect(tagsStore.items[0]).toEqual(tag);

			// Verify it was saved to IndexedDB
			const fromDb = await db.getById(tag.id);
			expect(fromDb).toEqual(tag);
		});

		it('should save to localStorage as backup', async () => {
			await tagsStore.load();
			const tag = createTestTag();

			await tagsStore.add(tag);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('tags-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(1);
			expect(fromLocalStorage[0]).toEqual(tag);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			await tagsStore.load();
			const tag = createTestTag();

			vi.spyOn(db, 'add').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await tagsStore.add(tag);

			expect(tagsStore.items).toHaveLength(1);
			expect(tagsStore.error).toBeTruthy();
		});
	});

	describe('update', () => {
		it('should update a tag in IndexedDB', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			const updated = { ...tag, name: 'Updated Tag', color: '#00FF00' };
			await tagsStore.update(updated);

			expect(tagsStore.items[0].name).toBe('Updated Tag');
			expect(tagsStore.items[0].color).toBe('#00FF00');

			// Verify it was updated in IndexedDB
			const fromDb = await db.getById(tag.id);
			expect(fromDb?.name).toBe('Updated Tag');
			expect(fromDb?.color).toBe('#00FF00');
		});

		it('should save to localStorage as backup', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			const updated = { ...tag, name: 'Updated Tag' };
			await tagsStore.update(updated);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('tags-fallback') || '[]');
			expect(fromLocalStorage[0].name).toBe('Updated Tag');
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			vi.spyOn(db, 'update').mockRejectedValueOnce(new Error('IndexedDB failed'));

			const updated = { ...tag, name: 'Updated Tag' };
			await tagsStore.update(updated);

			expect(tagsStore.items[0].name).toBe('Updated Tag');
			expect(tagsStore.error).toBeTruthy();
		});
	});

	describe('remove', () => {
		it('should delete a tag from IndexedDB', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			await tagsStore.remove(tag.id);

			expect(tagsStore.items).toHaveLength(0);

			// Verify it was deleted from IndexedDB
			const fromDb = await db.getById(tag.id);
			expect(fromDb).toBeUndefined();
		});

		it('should update localStorage backup', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			await tagsStore.remove(tag.id);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('tags-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(0);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			vi.spyOn(db, 'delete').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await tagsStore.remove(tag.id);

			expect(tagsStore.items).toHaveLength(0);
			expect(tagsStore.error).toBeTruthy();
		});
	});

	describe('getById', () => {
		it('should return a tag by ID', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			const found = tagsStore.getById(tag.id);
			expect(found).toEqual(tag);
		});

		it('should return undefined for non-existent ID', async () => {
			await tagsStore.load();

			const found = tagsStore.getById('non-existent');
			expect(found).toBeUndefined();
		});
	});

	describe('getByName', () => {
		it('should return a tag by name', async () => {
			const tag = createTestTag({ name: 'JavaScript' });
			await db.add(tag);
			await tagsStore.load();

			const found = tagsStore.getByName('JavaScript');
			expect(found).toEqual(tag);
		});

		it('should be case-insensitive', async () => {
			const tag = createTestTag({ name: 'JavaScript' });
			await db.add(tag);
			await tagsStore.load();

			const found = tagsStore.getByName('javascript');
			expect(found).toEqual(tag);
		});

		it('should return undefined for non-existent name', async () => {
			await tagsStore.load();

			const found = tagsStore.getByName('NonExistent');
			expect(found).toBeUndefined();
		});
	});

	describe('getByIds', () => {
		it('should return multiple tags by their IDs', async () => {
			const tag1 = createTestTag({ name: 'Tag 1' });
			const tag2 = createTestTag({ name: 'Tag 2' });
			const tag3 = createTestTag({ name: 'Tag 3' });

			await db.add(tag1);
			await db.add(tag2);
			await db.add(tag3);
			await tagsStore.load();

			const found = tagsStore.getByIds([tag1.id, tag3.id]);
			expect(found).toHaveLength(2);
			expect(found.map((t) => t.id)).toContain(tag1.id);
			expect(found.map((t) => t.id)).toContain(tag3.id);
		});

		it('should return empty array for non-existent IDs', async () => {
			await tagsStore.load();

			const found = tagsStore.getByIds(['non-existent-1', 'non-existent-2']);
			expect(found).toHaveLength(0);
		});
	});

	describe('search', () => {
		it('should search tags by name (partial match)', async () => {
			const tag1 = createTestTag({ name: 'JavaScript' });
			const tag2 = createTestTag({ name: 'TypeScript' });
			const tag3 = createTestTag({ name: 'Python' });

			await db.add(tag1);
			await db.add(tag2);
			await db.add(tag3);
			await tagsStore.load();

			const results = tagsStore.search('script');
			expect(results).toHaveLength(2);
			expect(results.map((t) => t.id)).toContain(tag1.id);
			expect(results.map((t) => t.id)).toContain(tag2.id);
		});

		it('should be case-insensitive', async () => {
			const tag = createTestTag({ name: 'JavaScript' });

			await db.add(tag);
			await tagsStore.load();

			const results = tagsStore.search('JAVASCRIPT');
			expect(results).toHaveLength(1);
		});

		it('should return empty array when no matches', async () => {
			const tag = createTestTag({ name: 'JavaScript' });

			await db.add(tag);
			await tagsStore.load();

			const results = tagsStore.search('python');
			expect(results).toHaveLength(0);
		});
	});

	describe('clear', () => {
		it('should remove all tags', async () => {
			const tag1 = createTestTag({ name: 'Tag 1' });
			const tag2 = createTestTag({ name: 'Tag 2' });

			await db.add(tag1);
			await db.add(tag2);
			await tagsStore.load();

			expect(tagsStore.items).toHaveLength(2);

			await tagsStore.clear();

			expect(tagsStore.items).toHaveLength(0);

			// Verify IndexedDB is cleared
			const fromDb = await db.getAll();
			expect(fromDb).toHaveLength(0);
		});

		it('should clear localStorage backup', async () => {
			const tag = createTestTag();
			await db.add(tag);
			await tagsStore.load();

			await tagsStore.clear();

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('tags-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(0);
		});
	});
});
