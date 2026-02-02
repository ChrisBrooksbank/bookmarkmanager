import { describe, it, expect, beforeEach } from 'vitest';
import { bookmarks, folders, tags, clearAllData } from './index';
import type { Bookmark, Folder, Tag } from '$lib/types';

describe('IndexedDB Wrapper', () => {
	beforeEach(async () => {
		// Clean up before each test
		try {
			await clearAllData();
		} catch {
			// Database might not exist yet, that's ok
		}
	});

	describe('Bookmarks', () => {
		const mockBookmark: Bookmark = {
			id: 'bookmark-1',
			url: 'https://example.com',
			title: 'Example Site',
			description: 'A test bookmark',
			folderId: null,
			tags: [],
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		it('should add a bookmark', async () => {
			await bookmarks.add(mockBookmark);
			const result = await bookmarks.getById(mockBookmark.id);
			expect(result).toEqual(mockBookmark);
		});

		it('should get all bookmarks', async () => {
			const bookmark2: Bookmark = {
				...mockBookmark,
				id: 'bookmark-2',
				url: 'https://example2.com',
				title: 'Example 2'
			};

			await bookmarks.add(mockBookmark);
			await bookmarks.add(bookmark2);

			const result = await bookmarks.getAll();
			expect(result).toHaveLength(2);
			expect(result).toContainEqual(mockBookmark);
			expect(result).toContainEqual(bookmark2);
		});

		it('should update a bookmark', async () => {
			await bookmarks.add(mockBookmark);

			const updatedBookmark = {
				...mockBookmark,
				title: 'Updated Title',
				updatedAt: Date.now()
			};

			await bookmarks.update(updatedBookmark);
			const result = await bookmarks.getById(mockBookmark.id);
			expect(result?.title).toBe('Updated Title');
		});

		it('should delete a bookmark', async () => {
			await bookmarks.add(mockBookmark);
			await bookmarks.delete(mockBookmark.id);
			const result = await bookmarks.getById(mockBookmark.id);
			expect(result).toBeUndefined();
		});

		it('should get bookmarks by folder ID', async () => {
			const bookmark1 = { ...mockBookmark, id: 'b1', folderId: 'folder-1' };
			const bookmark2 = { ...mockBookmark, id: 'b2', folderId: 'folder-1' };
			const bookmark3 = { ...mockBookmark, id: 'b3', folderId: 'folder-2' };

			await bookmarks.add(bookmark1);
			await bookmarks.add(bookmark2);
			await bookmarks.add(bookmark3);

			const result = await bookmarks.getByFolderId('folder-1');
			expect(result).toHaveLength(2);
			expect(result.map((b) => b.id).sort()).toEqual(['b1', 'b2']);
		});

		it('should get bookmarks by URL', async () => {
			const bookmark1 = { ...mockBookmark, id: 'b1', url: 'https://example.com' };
			const bookmark2 = { ...mockBookmark, id: 'b2', url: 'https://example.com' };
			const bookmark3 = { ...mockBookmark, id: 'b3', url: 'https://different.com' };

			await bookmarks.add(bookmark1);
			await bookmarks.add(bookmark2);
			await bookmarks.add(bookmark3);

			const result = await bookmarks.getByUrl('https://example.com');
			expect(result).toHaveLength(2);
			expect(result.map((b) => b.id).sort()).toEqual(['b1', 'b2']);
		});

		it('should return undefined for non-existent bookmark', async () => {
			const result = await bookmarks.getById('non-existent');
			expect(result).toBeUndefined();
		});
	});

	describe('Folders', () => {
		const mockFolder: Folder = {
			id: 'folder-1',
			name: 'My Folder',
			parentId: null,
			createdAt: Date.now()
		};

		it('should add a folder', async () => {
			await folders.add(mockFolder);
			const result = await folders.getById(mockFolder.id);
			expect(result).toEqual(mockFolder);
		});

		it('should get all folders', async () => {
			const folder2: Folder = {
				...mockFolder,
				id: 'folder-2',
				name: 'Another Folder'
			};

			await folders.add(mockFolder);
			await folders.add(folder2);

			const result = await folders.getAll();
			expect(result).toHaveLength(2);
			expect(result).toContainEqual(mockFolder);
			expect(result).toContainEqual(folder2);
		});

		it('should update a folder', async () => {
			await folders.add(mockFolder);

			const updatedFolder = {
				...mockFolder,
				name: 'Updated Folder Name'
			};

			await folders.update(updatedFolder);
			const result = await folders.getById(mockFolder.id);
			expect(result?.name).toBe('Updated Folder Name');
		});

		it('should delete a folder', async () => {
			await folders.add(mockFolder);
			await folders.delete(mockFolder.id);
			const result = await folders.getById(mockFolder.id);
			expect(result).toBeUndefined();
		});

		it('should get folders by parent ID', async () => {
			const rootFolder = { ...mockFolder, id: 'root', parentId: null };
			const childFolder1 = { ...mockFolder, id: 'child-1', parentId: 'root' };
			const childFolder2 = { ...mockFolder, id: 'child-2', parentId: 'root' };
			const grandchildFolder = { ...mockFolder, id: 'grandchild', parentId: 'child-1' };

			await folders.add(rootFolder);
			await folders.add(childFolder1);
			await folders.add(childFolder2);
			await folders.add(grandchildFolder);

			const rootChildren = await folders.getByParentId('root');
			expect(rootChildren).toHaveLength(2);
			expect(rootChildren.map((f) => f.id).sort()).toEqual(['child-1', 'child-2']);

			const child1Children = await folders.getByParentId('child-1');
			expect(child1Children).toHaveLength(1);
			expect(child1Children[0].id).toBe('grandchild');
		});

		it('should get root folders (null parent)', async () => {
			const rootFolder1 = { ...mockFolder, id: 'root-1', parentId: null };
			const rootFolder2 = { ...mockFolder, id: 'root-2', parentId: null };
			const childFolder = { ...mockFolder, id: 'child', parentId: 'root-1' };

			await folders.add(rootFolder1);
			await folders.add(rootFolder2);
			await folders.add(childFolder);

			const rootFolders = await folders.getByParentId(null);
			expect(rootFolders).toHaveLength(2);
			expect(rootFolders.map((f) => f.id).sort()).toEqual(['root-1', 'root-2']);
		});
	});

	describe('Tags', () => {
		const mockTag: Tag = {
			id: 'tag-1',
			name: 'JavaScript',
			color: '#f7df1e'
		};

		it('should add a tag', async () => {
			await tags.add(mockTag);
			const result = await tags.getById(mockTag.id);
			expect(result).toEqual(mockTag);
		});

		it('should get all tags', async () => {
			const tag2: Tag = {
				...mockTag,
				id: 'tag-2',
				name: 'TypeScript',
				color: '#3178c6'
			};

			await tags.add(mockTag);
			await tags.add(tag2);

			const result = await tags.getAll();
			expect(result).toHaveLength(2);
			expect(result).toContainEqual(mockTag);
			expect(result).toContainEqual(tag2);
		});

		it('should update a tag', async () => {
			await tags.add(mockTag);

			const updatedTag = {
				...mockTag,
				name: 'JS',
				color: '#000000'
			};

			await tags.update(updatedTag);
			const result = await tags.getById(mockTag.id);
			expect(result?.name).toBe('JS');
			expect(result?.color).toBe('#000000');
		});

		it('should delete a tag', async () => {
			await tags.add(mockTag);
			await tags.delete(mockTag.id);
			const result = await tags.getById(mockTag.id);
			expect(result).toBeUndefined();
		});

		it('should handle tags without color', async () => {
			const tagWithoutColor: Tag = {
				id: 'tag-3',
				name: 'No Color'
			};

			await tags.add(tagWithoutColor);
			const result = await tags.getById(tagWithoutColor.id);
			expect(result).toEqual(tagWithoutColor);
			expect(result?.color).toBeUndefined();
		});
	});

	describe('Clear All Data', () => {
		it('should clear all data from all stores', async () => {
			// Add data to all stores
			await bookmarks.add({
				id: 'b1',
				url: 'https://example.com',
				title: 'Test',
				tags: [],
				createdAt: Date.now(),
				updatedAt: Date.now()
			});

			await folders.add({
				id: 'f1',
				name: 'Folder',
				parentId: null,
				createdAt: Date.now()
			});

			await tags.add({
				id: 't1',
				name: 'Tag'
			});

			// Clear all data
			await clearAllData();

			// Verify all stores are empty
			const allBookmarks = await bookmarks.getAll();
			const allFolders = await folders.getAll();
			const allTags = await tags.getAll();

			expect(allBookmarks).toHaveLength(0);
			expect(allFolders).toHaveLength(0);
			expect(allTags).toHaveLength(0);
		});
	});
});
