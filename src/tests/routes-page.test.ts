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

	// Search function (simplified version of bookmarksStore.search)
	function searchBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
		const lowerQuery = query.toLowerCase();
		return bookmarks.filter(
			(b) =>
				b.title.toLowerCase().includes(lowerQuery) ||
				b.url.toLowerCase().includes(lowerQuery) ||
				(b.description && b.description.toLowerCase().includes(lowerQuery))
		);
	}

	// Sorting function extracted from +page.svelte
	function sortBookmarks(
		bookmarks: Bookmark[],
		sortBy: 'newest' | 'oldest' | 'alphabetical' | 'recently-updated'
	): Bookmark[] {
		const sorted = [...bookmarks];
		switch (sortBy) {
			case 'newest':
				sorted.sort((a, b) => b.createdAt - a.createdAt);
				break;
			case 'oldest':
				sorted.sort((a, b) => a.createdAt - b.createdAt);
				break;
			case 'alphabetical':
				sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
				break;
			case 'recently-updated':
				sorted.sort((a, b) => b.updatedAt - a.updatedAt);
				break;
		}
		return sorted;
	}

	// Filtering function extracted from +page.svelte
	function filterBookmarks(
		bookmarks: Bookmark[],
		searchQuery: string,
		selectedFolderId: string | null,
		selectedTagIds: string[],
		dateRange: 'all' | 'last-7-days' | 'last-30-days' | 'last-90-days' = 'all'
	): Bookmark[] {
		let results = bookmarks;

		// Filter by search query if present
		if (searchQuery.trim() !== '') {
			results = searchBookmarks(results, searchQuery);
		}

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

		// Filter by date range if not 'all'
		if (dateRange !== 'all') {
			const now = Date.now();
			let cutoffTime: number;

			switch (dateRange) {
				case 'last-7-days':
					cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
					break;
				case 'last-30-days':
					cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
					break;
				case 'last-90-days':
					cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
					break;
				default:
					cutoffTime = 0;
			}

			results = results.filter((bookmark) => bookmark.createdAt >= cutoffTime);
		}

		return results;
	}

	describe('date range filtering', () => {
		const now = Date.now();
		const bookmarksWithDates: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com/1',
				title: 'Recent Bookmark',
				description: 'Created today',
				folderId: null,
				tags: [],
				createdAt: now,
				updatedAt: now
			},
			{
				id: '2',
				url: 'https://example.com/2',
				title: '5 Days Ago',
				description: 'Created 5 days ago',
				folderId: null,
				tags: [],
				createdAt: now - 5 * 24 * 60 * 60 * 1000,
				updatedAt: now - 5 * 24 * 60 * 60 * 1000
			},
			{
				id: '3',
				url: 'https://example.com/3',
				title: '20 Days Ago',
				description: 'Created 20 days ago',
				folderId: null,
				tags: [],
				createdAt: now - 20 * 24 * 60 * 60 * 1000,
				updatedAt: now - 20 * 24 * 60 * 60 * 1000
			},
			{
				id: '4',
				url: 'https://example.com/4',
				title: '60 Days Ago',
				description: 'Created 60 days ago',
				folderId: null,
				tags: [],
				createdAt: now - 60 * 24 * 60 * 60 * 1000,
				updatedAt: now - 60 * 24 * 60 * 60 * 1000
			},
			{
				id: '5',
				url: 'https://example.com/5',
				title: '100 Days Ago',
				description: 'Created 100 days ago',
				folderId: null,
				tags: [],
				createdAt: now - 100 * 24 * 60 * 60 * 1000,
				updatedAt: now - 100 * 24 * 60 * 60 * 1000
			}
		];

		it('should return all bookmarks when dateRange is "all"', () => {
			const result = filterBookmarks(bookmarksWithDates, '', null, [], 'all');
			expect(result).toHaveLength(5);
		});

		it('should filter bookmarks from last 7 days', () => {
			const result = filterBookmarks(bookmarksWithDates, '', null, [], 'last-7-days');
			expect(result).toHaveLength(2);
			expect(result.map((b) => b.id).sort()).toEqual(['1', '2']);
		});

		it('should filter bookmarks from last 30 days', () => {
			const result = filterBookmarks(bookmarksWithDates, '', null, [], 'last-30-days');
			expect(result).toHaveLength(3);
			expect(result.map((b) => b.id).sort()).toEqual(['1', '2', '3']);
		});

		it('should filter bookmarks from last 90 days', () => {
			const result = filterBookmarks(bookmarksWithDates, '', null, [], 'last-90-days');
			expect(result).toHaveLength(4);
			expect(result.map((b) => b.id).sort()).toEqual(['1', '2', '3', '4']);
		});

		it('should combine date range with folder filter', () => {
			const bookmarksWithFolders: Bookmark[] = [
				{
					...bookmarksWithDates[0],
					folderId: 'folder1'
				},
				{
					...bookmarksWithDates[1],
					folderId: 'folder1'
				},
				{
					...bookmarksWithDates[2],
					folderId: 'folder2'
				}
			];
			const result = filterBookmarks(bookmarksWithFolders, '', 'folder1', [], 'last-7-days');
			expect(result).toHaveLength(2);
		});

		it('should combine date range with tag filter', () => {
			const bookmarksWithTags: Bookmark[] = [
				{
					...bookmarksWithDates[0],
					tags: ['tag1']
				},
				{
					...bookmarksWithDates[1],
					tags: ['tag1']
				},
				{
					...bookmarksWithDates[2],
					tags: ['tag1']
				}
			];
			const result = filterBookmarks(bookmarksWithTags, '', null, ['tag1'], 'last-7-days');
			expect(result).toHaveLength(2);
		});

		it('should combine date range with search filter', () => {
			const result = filterBookmarks(bookmarksWithDates, 'Days Ago', null, [], 'last-30-days');
			expect(result).toHaveLength(2); // Only "5 Days Ago" and "20 Days Ago"
		});

		it('should combine all filters including date range', () => {
			const complexBookmarks: Bookmark[] = [
				{
					...bookmarksWithDates[0],
					title: 'Recent Search Match',
					folderId: 'folder1',
					tags: ['tag1']
				},
				{
					...bookmarksWithDates[1],
					title: 'Old Search Match',
					folderId: 'folder1',
					tags: ['tag1']
				},
				{
					...bookmarksWithDates[2],
					title: 'Recent No Match',
					folderId: 'folder2',
					tags: ['tag1']
				}
			];
			const result = filterBookmarks(
				complexBookmarks,
				'Search Match',
				'folder1',
				['tag1'],
				'last-7-days'
			);
			expect(result).toHaveLength(2);
		});
	});

	describe('folder filtering', () => {
		it('should return all bookmarks when no folder is selected', () => {
			const result = filterBookmarks(bookmarks, '', null, []);
			expect(result).toHaveLength(4);
		});

		it('should filter by folder when folder is selected', () => {
			const result = filterBookmarks(bookmarks, '', 'folder1', []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should filter bookmarks with null folderId', () => {
			const result = filterBookmarks(bookmarks, '', null, []);
			expect(result).toHaveLength(4);
		});

		it('should return empty array when folder has no bookmarks', () => {
			const result = filterBookmarks(bookmarks, '', 'nonexistent', []);
			expect(result).toHaveLength(0);
		});
	});

	describe('tag filtering', () => {
		it('should return all bookmarks when no tags are selected', () => {
			const result = filterBookmarks(bookmarks, '', null, []);
			expect(result).toHaveLength(4);
		});

		it('should filter by single tag', () => {
			const result = filterBookmarks(bookmarks, '', null, ['tag1']);
			expect(result).toHaveLength(2);
			expect(result.map((b) => b.id).sort()).toEqual(['1', '2']);
		});

		it('should filter by multiple tags with AND logic', () => {
			const result = filterBookmarks(bookmarks, '', null, ['tag1', 'tag2']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should return empty array when no bookmarks have all selected tags', () => {
			const result = filterBookmarks(bookmarks, '', null, ['tag1', 'tag3']);
			expect(result).toHaveLength(0);
		});

		it('should handle bookmarks with no tags', () => {
			const result = filterBookmarks(bookmarks, '', null, ['tag1']);
			expect(result.every((b) => b.tags.includes('tag1'))).toBe(true);
		});
	});

	describe('combined filtering', () => {
		it('should filter by both folder and tags', () => {
			const result = filterBookmarks(bookmarks, '', 'folder2', ['tag2']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('should return empty array when folder and tag filters have no match', () => {
			const result = filterBookmarks(bookmarks, '', 'folder1', ['tag2', 'tag3']);
			expect(result).toHaveLength(0);
		});

		it('should prioritize folder filter then apply tag filter', () => {
			// Bookmark 1 has tag1 and tag2 but is in null folder
			// Bookmark 2 has tag1 and is in folder1
			const result = filterBookmarks(bookmarks, '', 'folder1', ['tag1']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});
	});

	describe('edge cases', () => {
		it('should handle empty bookmarks array', () => {
			const result = filterBookmarks([], '', null, []);
			expect(result).toHaveLength(0);
		});

		it('should handle empty bookmarks array with filters', () => {
			const result = filterBookmarks([], '', 'folder1', ['tag1']);
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
				'',
				null,
				['tag1']
			);
			expect(result).toHaveLength(0);
		});
	});

	describe('search filtering', () => {
		it('should search by title', () => {
			const result = filterBookmarks(bookmarks, 'Bookmark 1', null, []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should search by URL', () => {
			const result = filterBookmarks(bookmarks, 'example.com/2', null, []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should search by description', () => {
			const result = filterBookmarks(bookmarks, 'Description 3', null, []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('should be case-insensitive', () => {
			const result = filterBookmarks(bookmarks, 'BOOKMARK 1', null, []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should return partial matches', () => {
			const result = filterBookmarks(bookmarks, 'Bookmark', null, []);
			expect(result).toHaveLength(4);
		});

		it('should return empty array when no matches', () => {
			const result = filterBookmarks(bookmarks, 'nonexistent', null, []);
			expect(result).toHaveLength(0);
		});

		it('should ignore whitespace-only queries', () => {
			const result = filterBookmarks(bookmarks, '   ', null, []);
			expect(result).toHaveLength(4);
		});

		it('should combine search with folder filter', () => {
			const result = filterBookmarks(bookmarks, 'Bookmark', 'folder1', []);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should combine search with tag filter', () => {
			const result = filterBookmarks(bookmarks, 'Bookmark', null, ['tag1']);
			expect(result).toHaveLength(2);
			expect(result.map((b) => b.id).sort()).toEqual(['1', '2']);
		});

		it('should combine search with folder and tag filters', () => {
			const result = filterBookmarks(bookmarks, 'Bookmark', 'folder2', ['tag2']);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('should return empty array when search and filters have no match', () => {
			const result = filterBookmarks(bookmarks, 'Bookmark 1', 'folder2', []);
			expect(result).toHaveLength(0);
		});
	});

	describe('sorting functionality', () => {
		const bookmarksForSorting: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com/1',
				title: 'Charlie',
				description: '',
				folderId: null,
				tags: [],
				createdAt: new Date('2024-01-03').getTime(),
				updatedAt: new Date('2024-01-05').getTime()
			},
			{
				id: '2',
				url: 'https://example.com/2',
				title: 'Alpha',
				description: '',
				folderId: null,
				tags: [],
				createdAt: new Date('2024-01-01').getTime(),
				updatedAt: new Date('2024-01-02').getTime()
			},
			{
				id: '3',
				url: 'https://example.com/3',
				title: 'Bravo',
				description: '',
				folderId: null,
				tags: [],
				createdAt: new Date('2024-01-02').getTime(),
				updatedAt: new Date('2024-01-06').getTime()
			}
		];

		it('should sort by newest first (default)', () => {
			const result = sortBookmarks(bookmarksForSorting, 'newest');
			expect(result.map((b) => b.id)).toEqual(['1', '3', '2']);
		});

		it('should sort by oldest first', () => {
			const result = sortBookmarks(bookmarksForSorting, 'oldest');
			expect(result.map((b) => b.id)).toEqual(['2', '3', '1']);
		});

		it('should sort alphabetically by title', () => {
			const result = sortBookmarks(bookmarksForSorting, 'alphabetical');
			expect(result.map((b) => b.id)).toEqual(['2', '3', '1']); // Alpha, Bravo, Charlie
		});

		it('should sort by recently updated', () => {
			const result = sortBookmarks(bookmarksForSorting, 'recently-updated');
			expect(result.map((b) => b.id)).toEqual(['3', '1', '2']);
		});

		it('should be case-insensitive for alphabetical sort', () => {
			const bookmarksWithMixedCase: Bookmark[] = [
				{
					...bookmarksForSorting[0],
					title: 'zebra'
				},
				{
					...bookmarksForSorting[1],
					title: 'Apple'
				},
				{
					...bookmarksForSorting[2],
					title: 'Banana'
				}
			];
			const result = sortBookmarks(bookmarksWithMixedCase, 'alphabetical');
			expect(result.map((b) => b.title)).toEqual(['Apple', 'Banana', 'zebra']);
		});

		it('should not mutate the original array', () => {
			const original = [...bookmarksForSorting];
			sortBookmarks(bookmarksForSorting, 'alphabetical');
			expect(bookmarksForSorting).toEqual(original);
		});

		it('should handle empty array', () => {
			const result = sortBookmarks([], 'newest');
			expect(result).toHaveLength(0);
		});

		it('should handle single bookmark', () => {
			const singleBookmark = [bookmarksForSorting[0]];
			const result = sortBookmarks(singleBookmark, 'alphabetical');
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('clear filters button logic', () => {
		// Helper function to determine if clear filters button should be shown
		function shouldShowClearFilters(
			searchQuery: string,
			selectedFolderId: string | null,
			selectedTagIds: string[],
			dateRange: 'all' | 'last-7-days' | 'last-30-days' | 'last-90-days'
		): boolean {
			return (
				searchQuery.trim() !== '' ||
				selectedFolderId !== null ||
				selectedTagIds.length > 0 ||
				dateRange !== 'all'
			);
		}

		it('should not show clear filters button when no filters are active', () => {
			const shouldShow = shouldShowClearFilters('', null, [], 'all');
			expect(shouldShow).toBe(false);
		});

		it('should show clear filters button when search query is active', () => {
			const shouldShow = shouldShowClearFilters('test', null, [], 'all');
			expect(shouldShow).toBe(true);
		});

		it('should show clear filters button when folder filter is active', () => {
			const shouldShow = shouldShowClearFilters('', 'folder1', [], 'all');
			expect(shouldShow).toBe(true);
		});

		it('should show clear filters button when tag filter is active', () => {
			const shouldShow = shouldShowClearFilters('', null, ['tag1'], 'all');
			expect(shouldShow).toBe(true);
		});

		it('should show clear filters button when date range filter is active', () => {
			const shouldShow = shouldShowClearFilters('', null, [], 'last-7-days');
			expect(shouldShow).toBe(true);
		});

		it('should show clear filters button when multiple filters are active', () => {
			const shouldShow = shouldShowClearFilters('test', 'folder1', ['tag1'], 'last-7-days');
			expect(shouldShow).toBe(true);
		});

		it('should not show clear filters button for whitespace-only search', () => {
			const shouldShow = shouldShowClearFilters('   ', null, [], 'all');
			expect(shouldShow).toBe(false);
		});
	});

	describe('result count display logic', () => {
		// Helper function to determine if result count should be shown
		function shouldShowResultCount(
			searchQuery: string,
			selectedFolderId: string | null,
			selectedTagIds: string[],
			dateRange: 'all' | 'last-7-days' | 'last-30-days' | 'last-90-days'
		): boolean {
			return (
				searchQuery.trim() !== '' ||
				selectedFolderId !== null ||
				selectedTagIds.length > 0 ||
				dateRange !== 'all'
			);
		}

		it('should not show result count when no filters are active', () => {
			const hasFilters = shouldShowResultCount('', null, [], 'all');
			expect(hasFilters).toBe(false);
		});

		it('should show result count when search query is active', () => {
			const hasFilters = shouldShowResultCount('test', null, [], 'all');
			expect(hasFilters).toBe(true);
		});

		it('should show result count when folder filter is active', () => {
			const hasFilters = shouldShowResultCount('', 'folder1', [], 'all');
			expect(hasFilters).toBe(true);
		});

		it('should show result count when tag filter is active', () => {
			const hasFilters = shouldShowResultCount('', null, ['tag1'], 'all');
			expect(hasFilters).toBe(true);
		});

		it('should show result count when date range filter is active', () => {
			const hasFilters = shouldShowResultCount('', null, [], 'last-7-days');
			expect(hasFilters).toBe(true);
		});

		it('should show result count when multiple filters are active', () => {
			const hasFilters = shouldShowResultCount('test', 'folder1', ['tag1'], 'last-7-days');
			expect(hasFilters).toBe(true);
		});

		it('should ignore whitespace-only search query', () => {
			const hasFilters = shouldShowResultCount('   ', null, [], 'all');
			expect(hasFilters).toBe(false);
		});

		it('should correctly format result count for single result', () => {
			const count = 1;
			const text = `${count} ${count === 1 ? 'result' : 'results'}`;
			expect(text).toBe('1 result');
		});

		it('should correctly format result count for multiple results', () => {
			// Using function to test the logic dynamically
			function formatResultCount(count: number): string {
				return `${count} ${count === 1 ? 'result' : 'results'}`;
			}
			expect(formatResultCount(5)).toBe('5 results');
		});

		it('should show total bookmarks when filtered results differ from total', () => {
			// Using function to test the logic dynamically
			function shouldShowTotal(filteredCount: number, totalCount: number): boolean {
				return totalCount !== filteredCount;
			}
			expect(shouldShowTotal(5, 10)).toBe(true);
		});

		it('should not show total bookmarks when filtered results equal total', () => {
			// Using function to test the logic dynamically
			function shouldShowTotal(filteredCount: number, totalCount: number): boolean {
				return totalCount !== filteredCount;
			}
			expect(shouldShowTotal(10, 10)).toBe(false);
		});

		it('should correctly format total bookmarks for single bookmark', () => {
			// Using function to test the logic dynamically
			function formatBookmarkCount(totalCount: number): string {
				return `${totalCount} ${totalCount === 1 ? 'bookmark' : 'bookmarks'}`;
			}
			expect(formatBookmarkCount(1)).toBe('1 bookmark');
		});

		it('should correctly format total bookmarks for multiple bookmarks', () => {
			// Using function to test the logic dynamically
			function formatBookmarkCount(totalCount: number): string {
				return `${totalCount} ${totalCount === 1 ? 'bookmark' : 'bookmarks'}`;
			}
			expect(formatBookmarkCount(10)).toBe('10 bookmarks');
		});
	});
});
