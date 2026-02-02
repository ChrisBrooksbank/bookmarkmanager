import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { foldersStore } from '$lib/stores/folders.svelte';
import { folders as db, clearAllData } from '$lib/db';
import type { Folder } from '$lib/types';

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

// Helper to create a test folder
function createTestFolder(overrides?: Partial<Folder>): Folder {
	return {
		id: `folder-${Math.random().toString(36).substr(2, 9)}`,
		name: 'Test Folder',
		parentId: null,
		createdAt: Date.now(),
		...overrides
	};
}

describe('foldersStore', () => {
	beforeEach(async () => {
		// Clear IndexedDB and localStorage before each test
		await clearAllData();
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('load', () => {
		it('should load folders from IndexedDB', async () => {
			const folder = createTestFolder();
			await db.add(folder);

			await foldersStore.load();

			expect(foldersStore.items).toHaveLength(1);
			expect(foldersStore.items[0]).toEqual(folder);
			expect(foldersStore.loading).toBe(false);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const folder = createTestFolder();
			localStorageMock.setItem('folders-fallback', JSON.stringify([folder]));

			// Mock IndexedDB to fail
			vi.spyOn(db, 'getAll').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await foldersStore.load();

			expect(foldersStore.items).toHaveLength(1);
			expect(foldersStore.items[0]).toEqual(folder);
			expect(foldersStore.error).toBeTruthy();
		});

		it('should return empty array when both IndexedDB and localStorage fail', async () => {
			vi.spyOn(db, 'getAll').mockRejectedValueOnce(new Error('IndexedDB failed'));
			vi.spyOn(localStorageMock, 'getItem').mockImplementationOnce(() => {
				throw new Error('localStorage failed');
			});

			await foldersStore.load();

			expect(foldersStore.items).toHaveLength(0);
		});
	});

	describe('add', () => {
		it('should add a folder to IndexedDB', async () => {
			await foldersStore.load();
			const folder = createTestFolder();

			await foldersStore.add(folder);

			expect(foldersStore.items).toHaveLength(1);
			expect(foldersStore.items[0]).toEqual(folder);

			// Verify it was saved to IndexedDB
			const fromDb = await db.getById(folder.id);
			expect(fromDb).toEqual(folder);
		});

		it('should save to localStorage as backup', async () => {
			await foldersStore.load();
			const folder = createTestFolder();

			await foldersStore.add(folder);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('folders-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(1);
			expect(fromLocalStorage[0]).toEqual(folder);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			await foldersStore.load();
			const folder = createTestFolder();

			vi.spyOn(db, 'add').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await foldersStore.add(folder);

			expect(foldersStore.items).toHaveLength(1);
			expect(foldersStore.error).toBeTruthy();
		});
	});

	describe('update', () => {
		it('should update a folder in IndexedDB', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			const updated = { ...folder, name: 'Updated Name' };
			await foldersStore.update(updated);

			expect(foldersStore.items[0].name).toBe('Updated Name');

			// Verify it was updated in IndexedDB
			const fromDb = await db.getById(folder.id);
			expect(fromDb?.name).toBe('Updated Name');
		});

		it('should save to localStorage as backup', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			const updated = { ...folder, name: 'Updated Name' };
			await foldersStore.update(updated);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('folders-fallback') || '[]');
			expect(fromLocalStorage[0].name).toBe('Updated Name');
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			vi.spyOn(db, 'update').mockRejectedValueOnce(new Error('IndexedDB failed'));

			const updated = { ...folder, name: 'Updated Name' };
			await foldersStore.update(updated);

			expect(foldersStore.items[0].name).toBe('Updated Name');
			expect(foldersStore.error).toBeTruthy();
		});
	});

	describe('remove', () => {
		it('should delete a folder from IndexedDB', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			await foldersStore.remove(folder.id);

			expect(foldersStore.items).toHaveLength(0);

			// Verify it was deleted from IndexedDB
			const fromDb = await db.getById(folder.id);
			expect(fromDb).toBeUndefined();
		});

		it('should update localStorage backup', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			await foldersStore.remove(folder.id);

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('folders-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(0);
		});

		it('should fallback to localStorage when IndexedDB fails', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			vi.spyOn(db, 'delete').mockRejectedValueOnce(new Error('IndexedDB failed'));

			await foldersStore.remove(folder.id);

			expect(foldersStore.items).toHaveLength(0);
			expect(foldersStore.error).toBeTruthy();
		});
	});

	describe('getById', () => {
		it('should return a folder by ID', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			const found = foldersStore.getById(folder.id);
			expect(found).toEqual(folder);
		});

		it('should return undefined for non-existent ID', async () => {
			await foldersStore.load();

			const found = foldersStore.getById('non-existent');
			expect(found).toBeUndefined();
		});
	});

	describe('getByParentId', () => {
		it('should return folders with a specific parent', async () => {
			const parent = createTestFolder({ id: 'parent-1' });
			const child1 = createTestFolder({ parentId: 'parent-1' });
			const child2 = createTestFolder({ parentId: 'parent-2' });
			const child3 = createTestFolder({ parentId: 'parent-1' });

			await db.add(parent);
			await db.add(child1);
			await db.add(child2);
			await db.add(child3);
			await foldersStore.load();

			const children = foldersStore.getByParentId('parent-1');
			expect(children).toHaveLength(2);
			expect(children.map((f) => f.id)).toContain(child1.id);
			expect(children.map((f) => f.id)).toContain(child3.id);
		});

		it('should return root folders when parentId is null', async () => {
			const root1 = createTestFolder({ parentId: null });
			const root2 = createTestFolder({ parentId: null });
			const child = createTestFolder({ parentId: 'some-parent' });

			await db.add(root1);
			await db.add(root2);
			await db.add(child);
			await foldersStore.load();

			const rootFolders = foldersStore.getByParentId(null);
			expect(rootFolders).toHaveLength(2);
			expect(rootFolders.map((f) => f.id)).toContain(root1.id);
			expect(rootFolders.map((f) => f.id)).toContain(root2.id);
		});
	});

	describe('getRootFolders', () => {
		it('should return only folders without a parent', async () => {
			const root1 = createTestFolder({ parentId: null });
			const root2 = createTestFolder({ parentId: undefined });
			const child = createTestFolder({ parentId: 'some-parent' });

			await db.add(root1);
			await db.add(root2);
			await db.add(child);
			await foldersStore.load();

			const rootFolders = foldersStore.getRootFolders();
			expect(rootFolders).toHaveLength(2);
			expect(rootFolders.map((f) => f.id)).toContain(root1.id);
			expect(rootFolders.map((f) => f.id)).toContain(root2.id);
		});
	});

	describe('getChildren', () => {
		it('should return direct children of a folder', async () => {
			const parent = createTestFolder({ id: 'parent-1' });
			const child1 = createTestFolder({ parentId: 'parent-1', id: 'child-1' });
			const child2 = createTestFolder({ parentId: 'parent-1', id: 'child-2' });
			const grandchild = createTestFolder({ parentId: 'child-1' });

			await db.add(parent);
			await db.add(child1);
			await db.add(child2);
			await db.add(grandchild);
			await foldersStore.load();

			const children = foldersStore.getChildren('parent-1');
			expect(children).toHaveLength(2);
			expect(children.map((f) => f.id)).toContain(child1.id);
			expect(children.map((f) => f.id)).toContain(child2.id);
			expect(children.map((f) => f.id)).not.toContain(grandchild.id);
		});
	});

	describe('getDescendants', () => {
		it('should return all descendants of a folder recursively', async () => {
			const parent = createTestFolder({ id: 'parent-1' });
			const child1 = createTestFolder({ parentId: 'parent-1', id: 'child-1' });
			const child2 = createTestFolder({ parentId: 'parent-1', id: 'child-2' });
			const grandchild1 = createTestFolder({ parentId: 'child-1', id: 'grandchild-1' });
			const grandchild2 = createTestFolder({ parentId: 'child-2', id: 'grandchild-2' });
			const unrelated = createTestFolder({ id: 'unrelated' });

			await db.add(parent);
			await db.add(child1);
			await db.add(child2);
			await db.add(grandchild1);
			await db.add(grandchild2);
			await db.add(unrelated);
			await foldersStore.load();

			const descendants = foldersStore.getDescendants('parent-1');
			expect(descendants).toHaveLength(4);
			expect(descendants.map((f) => f.id)).toContain(child1.id);
			expect(descendants.map((f) => f.id)).toContain(child2.id);
			expect(descendants.map((f) => f.id)).toContain(grandchild1.id);
			expect(descendants.map((f) => f.id)).toContain(grandchild2.id);
			expect(descendants.map((f) => f.id)).not.toContain(unrelated.id);
		});

		it('should return empty array for folder with no children', async () => {
			const folder = createTestFolder({ id: 'folder-1' });
			await db.add(folder);
			await foldersStore.load();

			const descendants = foldersStore.getDescendants('folder-1');
			expect(descendants).toHaveLength(0);
		});
	});

	describe('getPath', () => {
		it('should return path from root to folder', async () => {
			const root = createTestFolder({ id: 'root', parentId: null });
			const child = createTestFolder({ id: 'child', parentId: 'root' });
			const grandchild = createTestFolder({ id: 'grandchild', parentId: 'child' });

			await db.add(root);
			await db.add(child);
			await db.add(grandchild);
			await foldersStore.load();

			const path = foldersStore.getPath('grandchild');
			expect(path).toEqual(['root', 'child', 'grandchild']);
		});

		it('should return single item for root folder', async () => {
			const root = createTestFolder({ id: 'root', parentId: null });
			await db.add(root);
			await foldersStore.load();

			const path = foldersStore.getPath('root');
			expect(path).toEqual(['root']);
		});

		it('should return empty array for non-existent folder', async () => {
			await foldersStore.load();

			const path = foldersStore.getPath('non-existent');
			expect(path).toEqual([]);
		});
	});

	describe('isDescendantOf', () => {
		it('should return true if folder is a descendant', async () => {
			const root = createTestFolder({ id: 'root', parentId: null });
			const child = createTestFolder({ id: 'child', parentId: 'root' });
			const grandchild = createTestFolder({ id: 'grandchild', parentId: 'child' });

			await db.add(root);
			await db.add(child);
			await db.add(grandchild);
			await foldersStore.load();

			expect(foldersStore.isDescendantOf('grandchild', 'root')).toBe(true);
			expect(foldersStore.isDescendantOf('grandchild', 'child')).toBe(true);
		});

		it('should return false if folder is not a descendant', async () => {
			const root = createTestFolder({ id: 'root', parentId: null });
			const other = createTestFolder({ id: 'other', parentId: null });

			await db.add(root);
			await db.add(other);
			await foldersStore.load();

			expect(foldersStore.isDescendantOf('other', 'root')).toBe(false);
		});

		it('should return false for same folder', async () => {
			const folder = createTestFolder({ id: 'folder', parentId: null });
			await db.add(folder);
			await foldersStore.load();

			expect(foldersStore.isDescendantOf('folder', 'folder')).toBe(false);
		});
	});

	describe('clear', () => {
		it('should remove all folders', async () => {
			const folder1 = createTestFolder();
			const folder2 = createTestFolder();

			await db.add(folder1);
			await db.add(folder2);
			await foldersStore.load();

			expect(foldersStore.items).toHaveLength(2);

			await foldersStore.clear();

			expect(foldersStore.items).toHaveLength(0);

			// Verify IndexedDB is cleared
			const fromDb = await db.getAll();
			expect(fromDb).toHaveLength(0);
		});

		it('should clear localStorage backup', async () => {
			const folder = createTestFolder();
			await db.add(folder);
			await foldersStore.load();

			await foldersStore.clear();

			const fromLocalStorage = JSON.parse(localStorageMock.getItem('folders-fallback') || '[]');
			expect(fromLocalStorage).toHaveLength(0);
		});
	});
});
