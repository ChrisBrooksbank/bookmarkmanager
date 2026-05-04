import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importBookmarksFromHTML, importBookmarksFromFile } from './importBookmarks';
import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
import { foldersStore } from '$lib/stores/folders.svelte';
import { tagsStore } from '$lib/stores/tags.svelte';

// Mock the stores
vi.mock('$lib/stores/bookmarks.svelte', () => ({
	bookmarksStore: {
		items: [],
		add: vi.fn(),
		addMany: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn()
	}
}));

vi.mock('$lib/stores/folders.svelte', () => ({
	foldersStore: {
		add: vi.fn(),
		addMany: vi.fn()
	}
}));

vi.mock('$lib/stores/tags.svelte', () => ({
	tagsStore: {
		items: [],
		addMany: vi.fn()
	}
}));

describe('importBookmarksFromHTML', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset mock items array
		(bookmarksStore as any).items = [];
		(tagsStore as any).items = [];
	});

	it('should return error for invalid HTML', async () => {
		const result = await importBookmarksFromHTML('invalid html');
		expect(result.bookmarksImported).toBe(0);
		expect(result.foldersImported).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('should return error for empty file', async () => {
		const result = await importBookmarksFromHTML('');
		expect(result.bookmarksImported).toBe(0);
		expect(result.foldersImported).toBe(0);
		expect(result.errors).toContain('File is empty');
	});

	it('should import simple bookmarks without folders', async () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
				<DT><A HREF="https://test.com">Test</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.bookmarksImported).toBe(2);
		expect(result.foldersImported).toBe(0);
		expect(result.errors).toHaveLength(0);
		expect(bookmarksStore.addMany).toHaveBeenCalledTimes(1);
		expect((bookmarksStore.addMany as any).mock.calls[0][0]).toHaveLength(2);
	});

	it('should import folders before bookmarks', async () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>My Folder</H3>
				<DL>
					<DT><A HREF="https://example.com">Example</A>
				</DL>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.bookmarksImported).toBe(1);
		expect(result.foldersImported).toBe(1);
		expect(result.errors).toHaveLength(0);

		// Verify folders are added before bookmarks
		expect(foldersStore.addMany).toHaveBeenCalledTimes(1);
		expect(bookmarksStore.addMany).toHaveBeenCalledTimes(1);
	});

	it('should preserve folder hierarchy', async () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>Parent</H3>
				<DL>
					<DT><H3>Child</H3>
					<DL>
						<DT><A HREF="https://example.com">Example</A>
					</DL>
				</DL>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.bookmarksImported).toBe(1);
		expect(result.foldersImported).toBe(2);
		expect(result.errors).toHaveLength(0);
		expect(foldersStore.addMany).toHaveBeenCalledTimes(1);
		expect((foldersStore.addMany as any).mock.calls[0][0]).toHaveLength(2);
	});

	it('should skip duplicate bookmarks by default', async () => {
		// Set up existing bookmarks
		(bookmarksStore as any).items = [
			{
				id: 'existing-1',
				url: 'https://example.com',
				title: 'Existing',
				tags: [],
				folderId: null,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		];

		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
				<DT><A HREF="https://test.com">Test</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.bookmarksImported).toBe(1); // Only test.com
		expect(result.bookmarksSkipped).toBe(1); // example.com skipped
		expect(result.errors).toHaveLength(0);
		expect(bookmarksStore.addMany).toHaveBeenCalledTimes(1);
		expect((bookmarksStore.addMany as any).mock.calls[0][0]).toHaveLength(1);
		expect(bookmarksStore.updateMany).toHaveBeenCalledWith([]);
	});

	it('should replace duplicate bookmarks when specified', async () => {
		// Set up existing bookmarks
		(bookmarksStore as any).items = [
			{
				id: 'existing-1',
				url: 'https://example.com',
				title: 'Old Title',
				tags: [],
				folderId: null,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		];

		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">New Title</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html, { duplicateHandling: 'replace' });
		expect(result.bookmarksImported).toBe(0);
		expect(result.bookmarksReplaced).toBe(1);
		expect(result.errors).toHaveLength(0);
		expect(bookmarksStore.updateMany).toHaveBeenCalledTimes(1);
		expect(bookmarksStore.addMany).toHaveBeenCalledWith([]);

		// Verify the update keeps the original ID
		const updateCall = (bookmarksStore.updateMany as any).mock.calls[0][0][0];
		expect(updateCall.id).toBe('existing-1');
		expect(updateCall.title).toBe('New Title');
	});

	it('should keep both bookmarks when specified', async () => {
		// Set up existing bookmarks
		(bookmarksStore as any).items = [
			{
				id: 'existing-1',
				url: 'https://example.com',
				title: 'Existing',
				tags: [],
				folderId: null,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		];

		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html, { duplicateHandling: 'keep' });
		expect(result.bookmarksImported).toBe(1);
		expect(result.bookmarksSkipped).toBe(0);
		expect(result.errors).toHaveLength(0);
		expect(bookmarksStore.addMany).toHaveBeenCalledTimes(1);
	});

	it('should call progress callback with correct values', async () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>Folder</H3>
				<DL>
					<DT><A HREF="https://example.com">Example</A>
					<DT><A HREF="https://test.com">Test</A>
				</DL>
			</DL>
			</HTML>
		`;

		const progressUpdates: Array<{ current: number; total: number }> = [];
		const onProgress = vi.fn((current: number, total: number) => {
			progressUpdates.push({ current, total });
		});

		await importBookmarksFromHTML(html, { onProgress });

		// Should have been called 3 times: 1 folder + 2 bookmarks
		expect(onProgress).toHaveBeenCalledTimes(3);
		expect(progressUpdates).toEqual([
			{ current: 1, total: 3 }, // Folder
			{ current: 2, total: 3 }, // First bookmark
			{ current: 3, total: 3 } // Second bookmark
		]);
	});

	it('should handle errors during folder import gracefully', async () => {
		// Make add throw error
		(foldersStore.addMany as any).mockRejectedValueOnce(new Error('Database error'));

		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>Folder</H3>
				<DL>
					<DT><A HREF="https://example.com">Example</A>
				</DL>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.foldersImported).toBe(0);
		expect(result.bookmarksImported).toBe(1); // Bookmark should still import
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain('Failed to import folders');
	});

	it('should handle errors during bookmark import gracefully', async () => {
		// Make bulk add throw error
		(bookmarksStore.addMany as any).mockRejectedValueOnce(new Error('Database error'));

		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
				<DT><A HREF="https://test.com">Test</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.bookmarksImported).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain('Failed to import bookmarks');
	});

	it('should include parsing errors in result', async () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="javascript:alert('xss')">Invalid</A>
				<DT><A HREF="https://valid.com">Valid</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html);
		expect(result.bookmarksImported).toBe(1);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors.some((e) => e.includes('invalid URL'))).toBe(true);
	});

	it('should apply default tag names to every imported bookmark', async () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
				<DT><A HREF="https://test.com">Test</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html, {
			defaultTagNames: ['Inbox', 'Research']
		});

		expect(result.bookmarksImported).toBe(2);
		expect(result.tagsImported).toBe(2);
		expect(tagsStore.addMany).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ name: 'Inbox' }),
				expect.objectContaining({ name: 'Research' })
			])
		);

		const addedBookmarks = (bookmarksStore.addMany as any).mock.calls[0][0];
		expect(addedBookmarks[0].tags).toHaveLength(2);
		expect(addedBookmarks[1].tags).toEqual(addedBookmarks[0].tags);
	});

	it('should apply contains, starts with, domain, and regex tag rules before bulk write', async () => {
		(tagsStore as any).items = [{ id: 'existing-docs', name: 'Docs' }];
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://github.com/acme/project">GitHub</A>
				<DT><A HREF="https://example.com/docs/api">Docs</A>
				<DT><A HREF="https://news.example.com/article">News</A>
			</DL>
			</HTML>
		`;

		const result = await importBookmarksFromHTML(html, {
			tagRules: [
				{ matchType: 'domain', pattern: 'github.com', tags: ['Dev'] },
				{ matchType: 'contains', pattern: '/docs/', tags: ['Docs'] },
				{ matchType: 'startsWith', pattern: 'https://news.', tags: ['News'] },
				{ matchType: 'regex', pattern: 'api$', tags: ['API'] }
			]
		});

		expect(result.bookmarksImported).toBe(3);
		expect(result.tagsImported).toBe(3);

		const addedTags = (tagsStore.addMany as any).mock.calls[0][0];
		expect(addedTags.map((tag: { name: string }) => tag.name).sort()).toEqual([
			'API',
			'Dev',
			'News'
		]);

		const addedBookmarks = (bookmarksStore.addMany as any).mock.calls[0][0];
		const github = addedBookmarks.find((bookmark: { url: string }) =>
			bookmark.url.includes('github.com')
		);
		const docs = addedBookmarks.find((bookmark: { url: string }) =>
			bookmark.url.includes('/docs/')
		);
		const news = addedBookmarks.find((bookmark: { url: string }) => bookmark.url.includes('news.'));
		expect(github.tags).toHaveLength(1);
		expect(docs.tags).toContain('existing-docs');
		expect(docs.tags).toHaveLength(2);
		expect(news.tags).toHaveLength(1);
	});
});

describe('importBookmarksFromFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(bookmarksStore as any).items = [];
		(tagsStore as any).items = [];
	});

	it('should read file and import bookmarks', async () => {
		const htmlContent = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
			</DL>
			</HTML>
		`;

		// Create a mock file with proper text() method
		const file = {
			text: async () => htmlContent
		} as File;

		const result = await importBookmarksFromFile(file);

		expect(result.bookmarksImported).toBe(1);
		expect(result.errors).toHaveLength(0);
	});

	it('should handle file read errors', async () => {
		// Create a mock file that will fail to read
		const mockFile = {
			text: vi.fn().mockRejectedValue(new Error('Read error'))
		} as unknown as File;

		const result = await importBookmarksFromFile(mockFile);

		expect(result.bookmarksImported).toBe(0);
		expect(result.errors).toContain('Failed to read file: Read error');
	});

	it('should pass options to import function', async () => {
		// Set up existing bookmarks
		(bookmarksStore as any).items = [
			{
				id: 'existing-1',
				url: 'https://example.com',
				title: 'Existing',
				tags: [],
				folderId: null,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		];

		const htmlContent = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
			</DL>
			</HTML>
		`;

		// Create a mock file with proper text() method
		const file = {
			text: async () => htmlContent
		} as File;

		const result = await importBookmarksFromFile(file, { duplicateHandling: 'replace' });

		expect(result.bookmarksReplaced).toBe(1);
		expect(result.bookmarksImported).toBe(0);
	});
});
