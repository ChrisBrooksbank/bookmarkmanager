/**
 * IndexedDB wrapper for bookmark manager
 * Provides CRUD operations for bookmarks, folders, and tags
 */

import type { Bookmark, Folder, Tag } from '$lib/types';

const DB_NAME = 'bookmark-manager';
const DB_VERSION = 1;

// Object store names
const STORES = {
	BOOKMARKS: 'bookmarks',
	FOLDERS: 'folders',
	TAGS: 'tags'
} as const;

/**
 * Initialize the IndexedDB database with schema
 */
function initDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create bookmarks store with indexes
			if (!db.objectStoreNames.contains(STORES.BOOKMARKS)) {
				const bookmarksStore = db.createObjectStore(STORES.BOOKMARKS, { keyPath: 'id' });
				bookmarksStore.createIndex('url', 'url', { unique: false });
				bookmarksStore.createIndex('folderId', 'folderId', { unique: false });
				bookmarksStore.createIndex('createdAt', 'createdAt', { unique: false });
				bookmarksStore.createIndex('updatedAt', 'updatedAt', { unique: false });
			}

			// Create folders store with indexes
			if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
				const foldersStore = db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
				foldersStore.createIndex('parentId', 'parentId', { unique: false });
				foldersStore.createIndex('name', 'name', { unique: false });
			}

			// Create tags store with indexes
			if (!db.objectStoreNames.contains(STORES.TAGS)) {
				const tagsStore = db.createObjectStore(STORES.TAGS, { keyPath: 'id' });
				tagsStore.createIndex('name', 'name', { unique: false });
			}
		};
	});
}

/**
 * Get a connection to the database
 */
async function getDB(): Promise<IDBDatabase> {
	return initDB();
}

/**
 * Generic helper to perform a transaction
 */
async function performTransaction<T>(
	storeName: string,
	mode: IDBTransactionMode,
	operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, mode);
		const store = transaction.objectStore(storeName);
		const request = operation(store);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Generic helper to get all items from a store
 */
async function getAll<T>(storeName: string): Promise<T[]> {
	return performTransaction(storeName, 'readonly', (store) => store.getAll());
}

/**
 * Generic helper to get an item by id
 */
async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
	return performTransaction(storeName, 'readonly', (store) => store.get(id));
}

/**
 * Generic helper to add an item
 */
async function add<T>(storeName: string, item: T): Promise<IDBValidKey> {
	return performTransaction(storeName, 'readwrite', (store) => store.add(item));
}

/**
 * Generic helper to update an item
 */
async function update<T>(storeName: string, item: T): Promise<IDBValidKey> {
	return performTransaction(storeName, 'readwrite', (store) => store.put(item));
}

/**
 * Generic helper to delete an item by id
 */
async function deleteById(storeName: string, id: string): Promise<void> {
	return performTransaction(storeName, 'readwrite', (store) => store.delete(id));
}

/**
 * Get all items from an index
 */
async function getAllByIndex<T>(
	storeName: string,
	indexName: string,
	query: IDBValidKey | IDBKeyRange | null
): Promise<T[]> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readonly');
		const store = transaction.objectStore(storeName);

		// When querying for null values, get all items and filter
		if (query === null) {
			const request = store.getAll();
			request.onsuccess = () => {
				const results = request.result.filter(
					(item: Record<string, unknown>) =>
						item[indexName] === null || item[indexName] === undefined
				);
				resolve(results);
			};
			request.onerror = () => reject(request.error);
		} else {
			const index = store.index(indexName);
			const request = index.getAll(query);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		}
	});
}

// Bookmark operations
export const bookmarks = {
	getAll: (): Promise<Bookmark[]> => getAll<Bookmark>(STORES.BOOKMARKS),
	getById: (id: string): Promise<Bookmark | undefined> => getById<Bookmark>(STORES.BOOKMARKS, id),
	add: (bookmark: Bookmark): Promise<IDBValidKey> => add(STORES.BOOKMARKS, bookmark),
	update: (bookmark: Bookmark): Promise<IDBValidKey> => update(STORES.BOOKMARKS, bookmark),
	delete: (id: string): Promise<void> => deleteById(STORES.BOOKMARKS, id),
	getByFolderId: (folderId: string | null): Promise<Bookmark[]> =>
		getAllByIndex<Bookmark>(STORES.BOOKMARKS, 'folderId', folderId),
	getByUrl: (url: string): Promise<Bookmark[]> =>
		getAllByIndex<Bookmark>(STORES.BOOKMARKS, 'url', url)
};

// Folder operations
export const folders = {
	getAll: (): Promise<Folder[]> => getAll<Folder>(STORES.FOLDERS),
	getById: (id: string): Promise<Folder | undefined> => getById<Folder>(STORES.FOLDERS, id),
	add: (folder: Folder): Promise<IDBValidKey> => add(STORES.FOLDERS, folder),
	update: (folder: Folder): Promise<IDBValidKey> => update(STORES.FOLDERS, folder),
	delete: (id: string): Promise<void> => deleteById(STORES.FOLDERS, id),
	getByParentId: (parentId: string | null): Promise<Folder[]> =>
		getAllByIndex<Folder>(STORES.FOLDERS, 'parentId', parentId)
};

// Tag operations
export const tags = {
	getAll: (): Promise<Tag[]> => getAll<Tag>(STORES.TAGS),
	getById: (id: string): Promise<Tag | undefined> => getById<Tag>(STORES.TAGS, id),
	add: (tag: Tag): Promise<IDBValidKey> => add(STORES.TAGS, tag),
	update: (tag: Tag): Promise<IDBValidKey> => update(STORES.TAGS, tag),
	delete: (id: string): Promise<void> => deleteById(STORES.TAGS, id)
};

// Utility to clear all data (useful for testing)
export async function clearAllData(): Promise<void> {
	const db = await getDB();
	const transaction = db.transaction([STORES.BOOKMARKS, STORES.FOLDERS, STORES.TAGS], 'readwrite');

	await Promise.all([
		new Promise<void>((resolve, reject) => {
			const request = transaction.objectStore(STORES.BOOKMARKS).clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		}),
		new Promise<void>((resolve, reject) => {
			const request = transaction.objectStore(STORES.FOLDERS).clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		}),
		new Promise<void>((resolve, reject) => {
			const request = transaction.objectStore(STORES.TAGS).clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		})
	]);
}

// Delete the entire database (useful for testing)
export async function deleteDatabase(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(DB_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}
