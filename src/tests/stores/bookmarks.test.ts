import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
import { bookmarks as db, clearAllData } from '$lib/db';
import type { Bookmark } from '$lib/types';

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

// Helper to create a test bookmark
function createTestBookmark(overrides?: Partial<Bookmark>): Bookmark {
	const now = Date.now();
	return {
		id: `bookmark-${Math.random().toString(36).substr(2, 9)}`,
		url: 'https://example.com',
		title: 'Test Bookmark',
		description: 'A test bookmark',
		tags: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

describe('bookmarksStore', () => {
	beforeEach(async () => {
		// Clear IndexedDB and localStorage before each test
		await clearAllData();
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('load', () => {
		it('should load bookmarks from IndexedDB', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);

			await bookmarksStore.load();

			expect(bookmarksStore.items).toHaveLength(1);
			expect(bookmarksStore.items[0]).toEqual(bookmark);
			expect(bookmarksStore.loading).toBe(false);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const bookmark = createTestBookmark();
			localStorageMock.setItem('bookmarks-fallback', JSON.stringify([bookmark]));

			// Mock IndexedDB to fail
			vi.spyOn(db, 'getAll').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await bookmarksStore.load();

			expect(bookmarksStore.items).toHaveLength(1);
			expect(bookmarksStore.items[0]).toEqual(bookmark);
			expect(bookmarksStore.error).toBeTruthy();
		});

		it('should return empty array when both IndexedDB and localStorage fail', async () => {
			vi.spyOn(db, 'getAll').mockRejectedValueOnce(new Error('IndexedDB failed'));
			vi.spyOn(localStorageMock, 'getItem').mockImplementationOnce(() => {
				throw new Error('localStorage failed');
			});

			await bookmarksStore.load();

			expect(bookmarksStore.items).toHaveLength(0);
		});
	});

	describe('add', () => {
		it('should add a bookmark to IndexedDB', async () => {
			await bookmarksStore.load();
			const bookmark = createTestBookmark();

			await bookmarksStore.add(bookmark);

			expect(bookmarksStore.items).toHaveLength(1);
			expect(bookmarksStore.items[0]).toEqual(bookmark);

			// Verify it was saved to IndexedDB
			const fromDb = await db.getById(bookmark.id);
			expect(fromDb).toEqual(bookmark);
		});

		it('should save to localStorage as backup', async () => {
			await bookmarksStore.load();
			const bookmark = createTestBookmark();

			await bookmarksStore.add(bookmark);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('bookmarks-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(1);
			expect(fromLocalStorage[0]).toEqual(bookmark);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			await bookmarksStore.load();
			const bookmark = createTestBookmark();

			vi.spyOn(db, 'add').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await bookmarksStore.add(bookmark);

			expect(bookmarksStore.items).toHaveLength(1);
			expect(bookmarksStore.error).toBeTruthy();
		});
	});

	describe('update', () => {
		it('should update a bookmark in IndexedDB', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			const updated = { ...bookmark, title: 'Updated Title', updatedAt: Date.now() };
			await bookmarksStore.update(updated);

			expect(bookmarksStore.items[0].title).toBe('Updated Title');

			// Verify it was updated in IndexedDB
			const fromDb = await db.getById(bookmark.id);
			expect(fromDb?.title).toBe('Updated Title');
		});

		it('should save to localStorage as backup', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			const updated = { ...bookmark, title: 'Updated Title', updatedAt: Date.now() };
			await bookmarksStore.update(updated);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('bookmarks-fallback') || '[]');
			expect(fromLocalStorage[0].title).toBe('Updated Title');
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			vi.spyOn(db, 'update').mockRejectedValueOnce(new Error('IndexedDB failed'));

			const updated = { ...bookmark, title: 'Updated Title', updatedAt: Date.now() };
			await bookmarksStore.update(updated);

			expect(bookmarksStore.items[0].title).toBe('Updated Title');
			expect(bookmarksStore.error).toBeTruthy();
		});
	});

	describe('remove', () => {
		it('should delete a bookmark from IndexedDB', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			await bookmarksStore.remove(bookmark.id);

			expect(bookmarksStore.items).toHaveLength(0);

			// Verify it was deleted from IndexedDB
			const fromDb = await db.getById(bookmark.id);
			expect(fromDb).toBeUndefined();
		});

		it('should update localStorage backup', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			await bookmarksStore.remove(bookmark.id);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('bookmarks-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(0);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			vi.spyOn(db, 'delete').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await bookmarksStore.remove(bookmark.id);

			expect(bookmarksStore.items).toHaveLength(0);
			expect(bookmarksStore.error).toBeTruthy();
		});
	});

	describe('getById', () => {
		it('should return a bookmark by ID', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			const found = bookmarksStore.getById(bookmark.id);
			expect(found).toEqual(bookmark);
		});

		it('should return undefined for non-existent ID', async () => {
			await bookmarksStore.load();

			const found = bookmarksStore.getById('non-existent');
			expect(found).toBeUndefined();
		});
	});

	describe('getByFolderId', () => {
		it('should return bookmarks in a specific folder', async () => {
			const bookmark1 = createTestBookmark({ folderId: 'folder-1' });
			const bookmark2 = createTestBookmark({ folderId: 'folder-2' });
			const bookmark3 = createTestBookmark({ folderId: 'folder-1' });

			await db.add(bookmark1);
			await db.add(bookmark2);
			await db.add(bookmark3);
			await bookmarksStore.load();

			const inFolder1 = bookmarksStore.getByFolderId('folder-1');
			expect(inFolder1).toHaveLength(2);
			expect(inFolder1.map((b) => b.id)).toContain(bookmark1.id);
			expect(inFolder1.map((b) => b.id)).toContain(bookmark3.id);
		});

		it('should return bookmarks with null folderId (root)', async () => {
			const bookmark1 = createTestBookmark({ folderId: null });
			const bookmark2 = createTestBookmark({ folderId: 'folder-1' });

			await db.add(bookmark1);
			await db.add(bookmark2);
			await bookmarksStore.load();

			const inRoot = bookmarksStore.getByFolderId(null);
			expect(inRoot).toHaveLength(1);
			expect(inRoot[0].id).toBe(bookmark1.id);
		});
	});

	describe('getByTagId', () => {
		it('should return bookmarks with a specific tag', async () => {
			const bookmark1 = createTestBookmark({ tags: ['tag-1', 'tag-2'] });
			const bookmark2 = createTestBookmark({ tags: ['tag-2'] });
			const bookmark3 = createTestBookmark({ tags: ['tag-3'] });

			await db.add(bookmark1);
			await db.add(bookmark2);
			await db.add(bookmark3);
			await bookmarksStore.load();

			const withTag2 = bookmarksStore.getByTagId('tag-2');
			expect(withTag2).toHaveLength(2);
			expect(withTag2.map((b) => b.id)).toContain(bookmark1.id);
			expect(withTag2.map((b) => b.id)).toContain(bookmark2.id);
		});
	});

	describe('search', () => {
		it('should search by title', async () => {
			const bookmark1 = createTestBookmark({ title: 'JavaScript Tutorial' });
			const bookmark2 = createTestBookmark({ title: 'Python Guide' });

			await db.add(bookmark1);
			await db.add(bookmark2);
			await bookmarksStore.load();

			const results = bookmarksStore.search('javascript');
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe(bookmark1.id);
		});

		it('should search by URL', async () => {
			const bookmark1 = createTestBookmark({ url: 'https://github.com/user/repo' });
			const bookmark2 = createTestBookmark({ url: 'https://example.com' });

			await db.add(bookmark1);
			await db.add(bookmark2);
			await bookmarksStore.load();

			const results = bookmarksStore.search('github');
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe(bookmark1.id);
		});

		it('should search by description', async () => {
			const bookmark1 = createTestBookmark({ description: 'Learn TypeScript basics' });
			const bookmark2 = createTestBookmark({ description: 'React hooks guide' });

			await db.add(bookmark1);
			await db.add(bookmark2);
			await bookmarksStore.load();

			const results = bookmarksStore.search('typescript');
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe(bookmark1.id);
		});

		it('should be case-insensitive', async () => {
			const bookmark = createTestBookmark({ title: 'JavaScript Tutorial' });

			await db.add(bookmark);
			await bookmarksStore.load();

			const results = bookmarksStore.search('JAVASCRIPT');
			expect(results).toHaveLength(1);
		});

		it('should return empty array when no matches', async () => {
			const bookmark = createTestBookmark({ title: 'JavaScript Tutorial' });

			await db.add(bookmark);
			await bookmarksStore.load();

			const results = bookmarksStore.search('python');
			expect(results).toHaveLength(0);
		});
	});

	describe('clear', () => {
		it('should remove all bookmarks', async () => {
			const bookmark1 = createTestBookmark();
			const bookmark2 = createTestBookmark();

			await db.add(bookmark1);
			await db.add(bookmark2);
			await bookmarksStore.load();

			expect(bookmarksStore.items).toHaveLength(2);

			await bookmarksStore.clear();

			expect(bookmarksStore.items).toHaveLength(0);

			// Verify IndexedDB is cleared
			const fromDb = await db.getAll();
			expect(fromDb).toHaveLength(0);
		});

		it('should clear localStorage backup', async () => {
			const bookmark = createTestBookmark();
			await db.add(bookmark);
			await bookmarksStore.load();

			await bookmarksStore.clear();

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('bookmarks-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(0);
		});
	});
});
