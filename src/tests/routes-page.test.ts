import { describe, it, expect } from 'vitest';
import type { Bookmark } from '$lib/types';

describe('Bookmark filtering logic', () => {
	// Sample bookmarks for testing
	const bookmarks: Bookmark[] = [
		{
			id: '1',
			url: 'https://example.com/1',
			title: 'Bookmark 1',
			description: 'Description 1',
			folderId: null,
			tags: ['tag1', 'tag2'],
			createdAt: new Date('2024-01-01').getTime(),
			updatedAt: new Date('2024-01-01').getTime()
		},
		{
			id: '2',
			url: 'https://example.com/2',
			title: 'Bookmark 2',
			description: 'Description 2',
			folderId: 'folder1',
			tags: ['tag1'],
			createdAt: new Date('2024-01-02').getTime(),
			updatedAt: new Date('2024-01-02').getTime()
		},
		{
			id: '3',
			url: 'https://example.com/3',
			title: 'Bookmark 3',
			description: 'Description 3',
			folderId: 'folder2',
			tags: ['tag2', 'tag3'],
			createdAt: new Date('2024-01-03').getTime(),
			updatedAt: new Date('2024-01-03').getTime()
		},
		{
			id: '4',
			url: 'https://example.com/4',
			title: 'Bookmark 4',
			description: 'Description 4',
			folderId: null,
			tags: [],
			createdAt: new Date('2024-01-04').getTime(),
			updatedAt: new Date('2024-01-04').getTime()
		}
	];

	// Filtering function extracted from +page.svelte
	function filterBookmarks(
		bookmarks: Bookmark[],
		selectedFolderId: string | null,
		selectedTagIds: string[]
	): Bookmark[] {
		let results = bookmarks;

		// Filter by folder if one is selected
		if (selectedFolderId !== null) {
			results = results.filter((b) => b.folderId === selectedFolderId);
		}

		// Filter by tags if any are selected (AND logic - bookmark must have ALL selected tags)
		if (selectedTagIds.length > 0) {
			results = results.filter((bookmark) =>
				selectedTagIds.every((tagId) => bookmark.tags.includes(tagId))
			);
		}

		return results;
	}

	describe('folder filtering', () => {
		it('should return all bookmarks when no folder is selected', () => {
			const result = filterBookmarks(bookmarks, null, []);
			expect(result).toHaveLength(4);
		});

		it('should filter by folder when folder is selected', () => {
			const result = filterBookmarks(bookmarks, 'folder1', []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should filter bookmarks with null folderId', () => {
			const result = filterBookmarks(bookmarks, null, []);
			expect(result).toHaveLength(4);
		});

		it('should return empty array when folder has no bookmarks', () => {
			const result = filterBookmarks(bookmarks, 'nonexistent', []);
			expect(result).toHaveLength(0);
		});
	});

	describe('tag filtering', () => {
		it('should return all bookmarks when no tags are selected', () => {
			const result = filterBookmarks(bookmarks, null, []);
			expect(result).toHaveLength(4);
		});

		it('should filter by single tag', () => {
			const result = filterBookmarks(bookmarks, null, ['tag1']);
			expect(result).toHaveLength(2);
			expect(result.map((b) => b.id).sort()).toEqual(['1', '2']);
		});

		it('should filter by multiple tags with AND logic', () => {
			const result = filterBookmarks(bookmarks, null, ['tag1', 'tag2']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should return empty array when no bookmarks have all selected tags', () => {
			const result = filterBookmarks(bookmarks, null, ['tag1', 'tag3']);
			expect(result).toHaveLength(0);
		});

		it('should handle bookmarks with no tags', () => {
			const result = filterBookmarks(bookmarks, null, ['tag1']);
			expect(result.every((b) => b.tags.includes('tag1'))).toBe(true);
		});
	});

	describe('combined filtering', () => {
		it('should filter by both folder and tags', () => {
			const result = filterBookmarks(bookmarks, 'folder2', ['tag2']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('should return empty array when folder and tag filters have no match', () => {
			const result = filterBookmarks(bookmarks, 'folder1', ['tag2', 'tag3']);
			expect(result).toHaveLength(0);
		});

		it('should prioritize folder filter then apply tag filter', () => {
			// Bookmark 1 has tag1 and tag2 but is in null folder
			// Bookmark 2 has tag1 and is in folder1
			const result = filterBookmarks(bookmarks, 'folder1', ['tag1']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});
	});

	describe('edge cases', () => {
		it('should handle empty bookmarks array', () => {
			const result = filterBookmarks([], null, []);
			expect(result).toHaveLength(0);
		});

		it('should handle empty bookmarks array with filters', () => {
			const result = filterBookmarks([], 'folder1', ['tag1']);
			expect(result).toHaveLength(0);
		});

		it('should handle bookmarks with empty tags array', () => {
			const result = filterBookmarks(
				[
					{
						id: '1',
						url: 'https://example.com',
						title: 'Test',
						description: '',
						folderId: null,
						tags: [],
						createdAt: Date.now(),
						updatedAt: Date.now()
					}
				],
				null,
				['tag1']
			);
			expect(result).toHaveLength(0);
		});
	});
});
