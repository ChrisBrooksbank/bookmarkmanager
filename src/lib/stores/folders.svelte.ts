/**
 * Folders store with IndexedDB persistence and localStorage fallback
 * Uses Svelte 5 runes for reactive state management
 * Supports nested folder hierarchy
 */

import type { Folder } from '$lib/types';
import { folders as db } from '$lib/db';

const STORAGE_KEY = 'folders-fallback';

/**
 * Try to save folders to localStorage as fallback
 */
function saveToLocalStorage(folders: Folder[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
	} catch (error) {
		console.error('Failed to save to localStorage:', error);
	}
}

/**
 * Try to load folders from localStorage as fallback
 */
function loadFromLocalStorage(): Folder[] {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error('Failed to load from localStorage:', error);
		return [];
	}
}

/**
 * Create a reactive folders store
 */
function createFoldersStore() {
	let folders = $state<Folder[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Load all folders from IndexedDB
	 */
	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			folders = await db.getAll();
			saveToLocalStorage(folders);
		} catch (err) {
			console.error('Failed to load folders from IndexedDB, using localStorage:', err);
			error = 'Failed to load from database, using local backup';
			folders = loadFromLocalStorage();
		} finally {
			loading = false;
		}
	}

	/**
	 * Add a new folder
	 */
	async function add(folder: Folder): Promise<void> {
		try {
			await db.add(folder);
			folders = [...folders, folder];
			saveToLocalStorage(folders);
		} catch (err) {
			console.error('Failed to add folder to IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';
			folders = [...folders, folder];
			saveToLocalStorage(folders);
		}
	}

	/**
	 * Update an existing folder
	 */
	async function update(updatedFolder: Folder): Promise<void> {
		try {
			await db.update(updatedFolder);
			folders = folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f));
			saveToLocalStorage(folders);
		} catch (err) {
			console.error('Failed to update folder in IndexedDB, using localStorage:', err);
			error = 'Failed to save to database, using local backup';
			folders = folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f));
			saveToLocalStorage(folders);
		}
	}

	/**
	 * Delete a folder by ID
	 */
	async function remove(id: string): Promise<void> {
		try {
			await db.delete(id);
			folders = folders.filter((f) => f.id !== id);
			saveToLocalStorage(folders);
		} catch (err) {
			console.error('Failed to delete folder from IndexedDB, using localStorage:', err);
			error = 'Failed to delete from database, using local backup';
			folders = folders.filter((f) => f.id !== id);
			saveToLocalStorage(folders);
		}
	}

	/**
	 * Get a folder by ID
	 */
	function getById(id: string): Folder | undefined {
		return folders.find((f) => f.id === id);
	}

	/**
	 * Get folders by parent ID (for nested hierarchy)
	 */
	function getByParentId(parentId: string | null): Folder[] {
		return folders.filter((f) => f.parentId === parentId);
	}

	/**
	 * Get root folders (folders with no parent)
	 */
	function getRootFolders(): Folder[] {
		return folders.filter((f) => !f.parentId);
	}

	/**
	 * Get all child folders of a folder (direct children only)
	 */
	function getChildren(folderId: string): Folder[] {
		return folders.filter((f) => f.parentId === folderId);
	}

	/**
	 * Get all descendant folders of a folder (recursive)
	 */
	function getDescendants(folderId: string): Folder[] {
		const descendants: Folder[] = [];
		const directChildren = getChildren(folderId);

		for (const child of directChildren) {
			descendants.push(child);
			descendants.push(...getDescendants(child.id));
		}

		return descendants;
	}

	/**
	 * Get path from root to a folder (array of folder IDs)
	 */
	function getPath(folderId: string): string[] {
		const path: string[] = [];
		let currentFolder = getById(folderId);

		while (currentFolder) {
			path.unshift(currentFolder.id);
			currentFolder = currentFolder.parentId ? getById(currentFolder.parentId) : undefined;
		}

		return path;
	}

	/**
	 * Check if a folder is a descendant of another folder
	 */
	function isDescendantOf(folderId: string, ancestorId: string): boolean {
		if (folderId === ancestorId) {
			return false;
		}
		const path = getPath(folderId);
		return path.includes(ancestorId);
	}

	/**
	 * Clear all folders
	 */
	async function clear(): Promise<void> {
		try {
			const allFolders = await db.getAll();
			await Promise.all(allFolders.map((f) => db.delete(f.id)));
			folders = [];
			saveToLocalStorage(folders);
		} catch (err) {
			console.error('Failed to clear folders from IndexedDB, using localStorage:', err);
			error = 'Failed to clear database, using local backup';
			folders = [];
			saveToLocalStorage(folders);
		}
	}

	return {
		get items() {
			return folders;
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
		getByParentId,
		getRootFolders,
		getChildren,
		getDescendants,
		getPath,
		isDescendantOf,
		clear
	};
}

export const foldersStore = createFoldersStore();
