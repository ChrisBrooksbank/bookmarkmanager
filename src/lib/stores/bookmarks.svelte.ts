/**
 * Bookmarks store with IndexedDB persistence and localStorage fallback
 * Uses Svelte 5 runes for reactive state management
 */

import type { Bookmark } from '$lib/types';
import { bookmarks as db } from '$lib/db';

const STORAGE_KEY = 'bookmarks-fallback';

/**
 * Try to save bookmarks to localStorage as fallback
 */
function saveToLocalStorage(bookmarks: Bookmark[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
	} catch (error) {
		console.error('Failed to save to localStorage:', error);
	}
}

/**
 * Try to load bookmarks from localStorage as fallback
 */
function loadFromLocalStorage(): Bookmark[] {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error('Failed to load from localStorage:', error);
		return [];
	}
}

/**
 * Create a reactive bookmarks store
 */
function createBookmarksStore() {
	let bookmarks = $state<Bookmark[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Load all bookmarks from IndexedDB
	 */
	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			bookmarks = await db.getAll();
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to load bookmarks from IndexedDB, using localStorage:', err);
			error = 'Failed to load from database, using local backup';
			bookmarks = loadFromLocalStorage();
		} finally {
			loading = false;
		}
	}

	/**
	 * Add a new bookmark
	 */
	async function add(bookmark: Bookmark): Promise<void> {
		try {
			await db.add(bookmark);
			bookmarks = [...bookmarks, bookmark];
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to add bookmark to IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';
			bookmarks = [...bookmarks, bookmark];
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Update an existing bookmark
	 */
	async function update(updatedBookmark: Bookmark): Promise<void> {
		try {
			await db.update(updatedBookmark);
			bookmarks = bookmarks.map((b) => (b.id === updatedBookmark.id ? updatedBookmark : b));
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to update bookmark in IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';
			bookmarks = bookmarks.map((b) => (b.id === updatedBookmark.id ? updatedBookmark : b));
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Delete a bookmark by ID
	 */
	async function remove(id: string): Promise<void> {
		try {
			await db.delete(id);
			bookmarks = bookmarks.filter((b) => b.id !== id);
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to delete bookmark from IndexedDB, using localStorage:', err);
			error = 'Failed to delete from database, using local backup';
			bookmarks = bookmarks.filter((b) => b.id !== id);
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Get a bookmark by ID
	 */
	function getById(id: string): Bookmark | undefined {
		return bookmarks.find((b) => b.id === id);
	}

	/**
	 * Get bookmarks by folder ID
	 */
	function getByFolderId(folderId: string | null): Bookmark[] {
		return bookmarks.filter((b) => b.folderId === folderId);
	}

	/**
	 * Get bookmarks by tag ID
	 */
	function getByTagId(tagId: string): Bookmark[] {
		return bookmarks.filter((b) => b.tags.includes(tagId));
	}

	/**
	 * Search bookmarks by text query (searches title, url, description, notes)
	 */
	function search(query: string): Bookmark[] {
		const lowerQuery = query.toLowerCase();
		return bookmarks.filter(
			(b) =>
				b.title.toLowerCase().includes(lowerQuery) ||
				b.url.toLowerCase().includes(lowerQuery) ||
				(b.description && b.description.toLowerCase().includes(lowerQuery)) ||
				(b.notes && b.notes.toLowerCase().includes(lowerQuery))
		);
	}

	/**
	 * Clear all bookmarks
	 */
	async function clear(): Promise<void> {
		try {
			const allBookmarks = await db.getAll();
			await Promise.all(allBookmarks.map((b) => db.delete(b.id)));
			bookmarks = [];
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to clear bookmarks from IndexedDB, using localStorage:', err);
			error = 'Failed to clear database, using local backup';
			bookmarks = [];
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Add tags to multiple bookmarks
	 */
	async function bulkAddTags(bookmarkIds: string[], tagIds: string[]): Promise<void> {
		try {
			const updates: Promise<unknown>[] = [];
			const updatedBookmarks: Bookmark[] = [];

			for (const id of bookmarkIds) {
				const bookmark = bookmarks.find((b) => b.id === id);
				if (bookmark) {
					// Add tags that aren't already present
					const newTags = [...new Set([...bookmark.tags, ...tagIds])];
					const updatedBookmark = {
						...bookmark,
						tags: newTags,
						updatedAt: Date.now()
					};
					updates.push(db.update(updatedBookmark));
					updatedBookmarks.push(updatedBookmark);
				}
			}

			await Promise.all(updates);

			// Update local state
			bookmarks = bookmarks.map((b) => {
				const updated = updatedBookmarks.find((ub) => ub.id === b.id);
				return updated || b;
			});
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to bulk add tags in IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';

			// Update local state even on error
			bookmarks = bookmarks.map((b) => {
				if (bookmarkIds.includes(b.id)) {
					const newTags = [...new Set([...b.tags, ...tagIds])];
					return {
						...b,
						tags: newTags,
						updatedAt: Date.now()
					};
				}
				return b;
			});
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Remove tags from multiple bookmarks
	 */
	async function bulkRemoveTags(bookmarkIds: string[], tagIds: string[]): Promise<void> {
		try {
			const updates: Promise<unknown>[] = [];
			const updatedBookmarks: Bookmark[] = [];

			for (const id of bookmarkIds) {
				const bookmark = bookmarks.find((b) => b.id === id);
				if (bookmark) {
					// Remove specified tags
					const newTags = bookmark.tags.filter((tagId) => !tagIds.includes(tagId));
					const updatedBookmark = {
						...bookmark,
						tags: newTags,
						updatedAt: Date.now()
					};
					updates.push(db.update(updatedBookmark));
					updatedBookmarks.push(updatedBookmark);
				}
			}

			await Promise.all(updates);

			// Update local state
			bookmarks = bookmarks.map((b) => {
				const updated = updatedBookmarks.find((ub) => ub.id === b.id);
				return updated || b;
			});
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to bulk remove tags in IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';

			// Update local state even on error
			bookmarks = bookmarks.map((b) => {
				if (bookmarkIds.includes(b.id)) {
					const newTags = b.tags.filter((tagId) => !tagIds.includes(tagId));
					return {
						...b,
						tags: newTags,
						updatedAt: Date.now()
					};
				}
				return b;
			});
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Move multiple bookmarks to a folder
	 */
	async function bulkMoveToFolder(bookmarkIds: string[], folderId: string | null): Promise<void> {
		try {
			const updates: Promise<unknown>[] = [];
			const updatedBookmarks: Bookmark[] = [];

			for (const id of bookmarkIds) {
				const bookmark = bookmarks.find((b) => b.id === id);
				if (bookmark) {
					// Create a clean copy to avoid Svelte reactivity issues with structured clone
					const updatedBookmark: Bookmark = {
						id: bookmark.id,
						url: bookmark.url,
						title: bookmark.title,
						description: bookmark.description,
						notes: bookmark.notes,
						folderId,
						tags: [...bookmark.tags],
						createdAt: bookmark.createdAt,
						updatedAt: Date.now(),
						faviconUrl: bookmark.faviconUrl
					};
					updates.push(db.update(updatedBookmark));
					updatedBookmarks.push(updatedBookmark);
				}
			}

			await Promise.all(updates);

			// Update local state
			bookmarks = bookmarks.map((b) => {
				const updated = updatedBookmarks.find((ub) => ub.id === b.id);
				return updated || b;
			});
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to bulk move to folder in IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';

			// Update local state even on error
			bookmarks = bookmarks.map((b) => {
				if (bookmarkIds.includes(b.id)) {
					return {
						...b,
						folderId,
						updatedAt: Date.now()
					};
				}
				return b;
			});
			saveToLocalStorage(bookmarks);
		}
	}

	/**
	 * Delete multiple bookmarks
	 */
	async function bulkDelete(bookmarkIds: string[]): Promise<void> {
		try {
			const deletes: Promise<unknown>[] = [];

			for (const id of bookmarkIds) {
				deletes.push(db.delete(id));
			}

			await Promise.all(deletes);

			// Update local state
			bookmarks = bookmarks.filter((b) => !bookmarkIds.includes(b.id));
			saveToLocalStorage(bookmarks);
		} catch (err) {
			console.error('Failed to bulk delete from IndexedDB, using localStorage:', err);
			error = 'Failed to delete from database, using local backup';

			// Update local state even on error
			bookmarks = bookmarks.filter((b) => !bookmarkIds.includes(b.id));
			saveToLocalStorage(bookmarks);
		}
	}

	return {
		get items() {
			return bookmarks;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		load,
		add,
		update,
		remove,
		getById,
		getByFolderId,
		getByTagId,
		search,
		clear,
		bulkAddTags,
		bulkRemoveTags,
		bulkMoveToFolder,
		bulkDelete
	};
}

export const bookmarksStore = createBookmarksStore();
