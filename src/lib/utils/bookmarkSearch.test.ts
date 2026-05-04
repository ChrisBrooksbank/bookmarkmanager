import { describe, expect, it } from 'vitest';
import { matchesBookmarkSearch } from './bookmarkSearch';
import type { Bookmark, Folder, Tag } from '$lib/types';

const tags: Tag[] = [
	{ id: 'dev', name: 'Dev' },
	{ id: 'docs', name: 'Documentation' }
];

const folders: Folder[] = [
	{ id: 'work', name: 'Work', parentId: null, createdAt: 1 },
	{ id: 'api', name: 'API', parentId: 'work', createdAt: 1 }
];

const bookmark: Bookmark = {
	id: 'bookmark-1',
	title: 'SvelteKit Docs',
	url: 'https://kit.svelte.dev/docs/routing',
	description: 'Framework guide',
	notes: 'Read before migration',
	folderId: 'api',
	tags: ['dev', 'docs'],
	createdAt: 1,
	updatedAt: 1
};

const context = {
	tagsById: new Map(tags.map((tag) => [tag.id, tag])),
	foldersById: new Map(folders.map((folder) => [folder.id, folder]))
};

describe('matchesBookmarkSearch', () => {
	it('matches ordinary text across title, URL, notes, tags, folders, and domain', () => {
		expect(matchesBookmarkSearch(bookmark, 'sveltekit', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, 'migration', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, 'documentation', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, 'work/api', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, 'kit.svelte.dev', context)).toBe(true);
	});

	it('matches fielded queries', () => {
		expect(matchesBookmarkSearch(bookmark, 'tag:dev folder:api domain:svelte.dev', context)).toBe(
			true
		);
		expect(matchesBookmarkSearch(bookmark, 'title:docs url:routing notes:migration', context)).toBe(
			true
		);
		expect(matchesBookmarkSearch(bookmark, 'tag:finance', context)).toBe(false);
	});

	it('supports quoted phrases, hash tags, and negation', () => {
		expect(matchesBookmarkSearch(bookmark, 'notes:"before migration"', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, '#docs', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, '-tag:finance docs', context)).toBe(true);
		expect(matchesBookmarkSearch(bookmark, '-tag:dev docs', context)).toBe(false);
	});
});
