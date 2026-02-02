/**
 * Tags store with IndexedDB persistence and localStorage fallback
 * Uses Svelte 5 runes for reactive state management
 */

import type { Tag } from '$lib/types';
import { tags as db } from '$lib/db';

const STORAGE_KEY = 'tags-fallback';

/**
 * Try to save tags to localStorage as fallback
 */
function saveToLocalStorage(tags: Tag[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
	} catch (error) {
		console.error('Failed to save to localStorage:', error);
	}
}

/**
 * Try to load tags from localStorage as fallback
 */
function loadFromLocalStorage(): Tag[] {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error('Failed to load from localStorage:', error);
		return [];
	}
}

/**
 * Create a reactive tags store
 */
function createTagsStore() {
	let tags = $state<Tag[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Load all tags from IndexedDB
	 */
	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			tags = await db.getAll();
			saveToLocalStorage(tags);
		} catch (err) {
			console.error('Failed to load tags from IndexedDB, using localStorage:', err);
			error = 'Failed to load from database, using local backup';
			tags = loadFromLocalStorage();
		} finally {
			loading = false;
		}
	}

	/**
	 * Add a new tag
	 */
	async function add(tag: Tag): Promise<void> {
		try {
			await db.add(tag);
			tags = [...tags, tag];
			saveToLocalStorage(tags);
		} catch (err) {
			console.error('Failed to add tag to IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';
			tags = [...tags, tag];
			saveToLocalStorage(tags);
		}
	}

	/**
	 * Update an existing tag
	 */
	async function update(updatedTag: Tag): Promise<void> {
		try {
			await db.update(updatedTag);
			tags = tags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
			saveToLocalStorage(tags);
		} catch (err) {
			console.error('Failed to update tag in IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';
			tags = tags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
			saveToLocalStorage(tags);
		}
	}

	/**
	 * Delete a tag by ID
	 */
	async function remove(id: string): Promise<void> {
		try {
			await db.delete(id);
			tags = tags.filter((t) => t.id !== id);
			saveToLocalStorage(tags);
		} catch (err) {
			console.error('Failed to delete tag from IndexedDB, using localStorage:', err);
			error = 'Failed to delete from database, using local backup';
			tags = tags.filter((t) => t.id !== id);
			saveToLocalStorage(tags);
		}
	}

	/**
	 * Get a tag by ID
	 */
	function getById(id: string): Tag | undefined {
		return tags.find((t) => t.id === id);
	}

	/**
	 * Get a tag by name (case-insensitive)
	 */
	function getByName(name: string): Tag | undefined {
		const lowerName = name.toLowerCase();
		return tags.find((t) => t.name.toLowerCase() === lowerName);
	}

	/**
	 * Get multiple tags by their IDs
	 */
	function getByIds(ids: string[]): Tag[] {
		return tags.filter((t) => ids.includes(t.id));
	}

	/**
	 * Search tags by name (partial match)
	 */
	function search(query: string): Tag[] {
		const lowerQuery = query.toLowerCase();
		return tags.filter((t) => t.name.toLowerCase().includes(lowerQuery));
	}

	/**
	 * Clear all tags
	 */
	async function clear(): Promise<void> {
		try {
			const allTags = await db.getAll();
			await Promise.all(allTags.map((t) => db.delete(t.id)));
			tags = [];
			saveToLocalStorage(tags);
		} catch (err) {
			console.error('Failed to clear tags from IndexedDB, using localStorage:', err);
			error = 'Failed to clear database, using local backup';
			tags = [];
			saveToLocalStorage(tags);
		}
	}

	return {
		get items() {
			return tags;
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
		getByName,
		getByIds,
		search,
		clear
	};
}

export const tagsStore = createTagsStore();
