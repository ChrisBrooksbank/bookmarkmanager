import { describe, it, expect } from 'vitest';
import { parseNetscapeBookmarks, validateBookmarkHTML } from './bookmarkParser';

describe('validateBookmarkHTML', () => {
	it('should return error for empty string', () => {
		const result = validateBookmarkHTML('');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('File is empty');
	});

	it('should return error for whitespace-only string', () => {
		const result = validateBookmarkHTML('   ');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('File is empty');
	});

	it('should return error for non-bookmark HTML', () => {
		const result = validateBookmarkHTML('<div>Hello World</div>');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('File does not appear to be a valid bookmark HTML file');
	});

	it('should accept HTML with DOCTYPE NETSCAPE-Bookmark-file-1', () => {
		const result = validateBookmarkHTML('<!DOCTYPE NETSCAPE-Bookmark-file-1><html></html>');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept HTML with html tag (case insensitive)', () => {
		const result = validateBookmarkHTML('<HTML><HEAD></HEAD></HTML>');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});
});

describe('parseNetscapeBookmarks', () => {
	it('should return empty arrays and error for invalid HTML', () => {
		const result = parseNetscapeBookmarks('<div>Not a bookmark file</div>');
		expect(result.bookmarks).toHaveLength(0);
		expect(result.folders).toHaveLength(0);
		expect(result.errors).toContain('Invalid bookmark file: No bookmark list found');
	});

	it('should parse a simple bookmark without folder', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com" ADD_DATE="1609459200">Example Site</A>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.bookmarks).toHaveLength(1);
		expect(result.folders).toHaveLength(0);
		expect(result.errors).toHaveLength(0);

		const bookmark = result.bookmarks[0];
		expect(bookmark.url).toBe('https://example.com');
		expect(bookmark.title).toBe('Example Site');
		expect(bookmark.folderId).toBeNull();
		expect(bookmark.createdAt).toBe(1609459200 * 1000);
		expect(bookmark.tags).toEqual([]);
	});

	it('should parse a bookmark with description', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example Site</A>
				<DD>This is a description
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.bookmarks).toHaveLength(1);
		expect(result.bookmarks[0].description).toBe('This is a description');
	});

	it('should parse a bookmark with favicon', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com" ICON="data:image/png;base64,abc123">Example Site</A>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.bookmarks).toHaveLength(1);
		expect(result.bookmarks[0].faviconUrl).toBe('data:image/png;base64,abc123');
	});

	it('should skip bookmarks with invalid URLs', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="javascript:alert('test')">Invalid URL</A>
				<DT><A HREF="ftp://example.com">FTP URL</A>
				<DT><A HREF="">Empty URL</A>
				<DT><A HREF="https://valid.com">Valid URL</A>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.bookmarks).toHaveLength(1);
		expect(result.bookmarks[0].url).toBe('https://valid.com');
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('should parse a simple folder structure', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3 ADD_DATE="1609459200">My Folder</H3>
				<DL>
					<DT><A HREF="https://example.com">Example Site</A>
				</DL>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(1);
		expect(result.bookmarks).toHaveLength(1);

		const folder = result.folders[0];
		expect(folder.name).toBe('My Folder');
		expect(folder.parentId).toBeNull();
		expect(folder.createdAt).toBe(1609459200 * 1000);

		const bookmark = result.bookmarks[0];
		expect(bookmark.folderId).toBe(folder.id);
	});

	it('should parse nested folder structure', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>Parent Folder</H3>
				<DL>
					<DT><H3>Child Folder</H3>
					<DL>
						<DT><A HREF="https://example.com">Nested Bookmark</A>
					</DL>
				</DL>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(2);
		expect(result.bookmarks).toHaveLength(1);

		const parentFolder = result.folders.find((f) => f.name === 'Parent Folder')!;
		const childFolder = result.folders.find((f) => f.name === 'Child Folder')!;

		expect(parentFolder.parentId).toBeNull();
		expect(childFolder.parentId).toBe(parentFolder.id);

		const bookmark = result.bookmarks[0];
		expect(bookmark.folderId).toBe(childFolder.id);
	});

	it('should parse multiple bookmarks in the same folder', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>My Folder</H3>
				<DL>
					<DT><A HREF="https://example1.com">Site 1</A>
					<DT><A HREF="https://example2.com">Site 2</A>
					<DT><A HREF="https://example3.com">Site 3</A>
				</DL>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(1);
		expect(result.bookmarks).toHaveLength(3);

		const folderId = result.folders[0].id;
		expect(result.bookmarks.every((b) => b.folderId === folderId)).toBe(true);
	});

	it('should parse mixed root-level and folder bookmarks', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://root.com">Root Bookmark</A>
				<DT><H3>Folder 1</H3>
				<DL>
					<DT><A HREF="https://folder1.com">Folder 1 Bookmark</A>
				</DL>
				<DT><A HREF="https://root2.com">Another Root Bookmark</A>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(1);
		expect(result.bookmarks).toHaveLength(3);

		const rootBookmarks = result.bookmarks.filter((b) => b.folderId === null);
		const folderBookmarks = result.bookmarks.filter((b) => b.folderId !== null);

		expect(rootBookmarks).toHaveLength(2);
		expect(folderBookmarks).toHaveLength(1);
	});

	it('should handle empty folders', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3>Empty Folder</H3>
				<DL></DL>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(1);
		expect(result.bookmarks).toHaveLength(0);
		expect(result.folders[0].name).toBe('Empty Folder');
	});

	it('should handle unnamed folders and bookmarks', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><H3></H3>
				<DL>
					<DT><A HREF="https://example.com"></A>
				</DL>
			</DL>
			</HTML>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(1);
		expect(result.bookmarks).toHaveLength(1);
		expect(result.folders[0].name).toBe('Unnamed Folder');
		expect(result.bookmarks[0].title).toBe('Untitled');
	});

	it('should use current timestamp for missing ADD_DATE', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<HTML>
			<DL>
				<DT><A HREF="https://example.com">Example</A>
			</DL>
			</HTML>
		`;

		const beforeParse = Date.now();
		const result = parseNetscapeBookmarks(html);
		const afterParse = Date.now();

		expect(result.bookmarks).toHaveLength(1);
		const bookmark = result.bookmarks[0];
		expect(bookmark.createdAt).toBeGreaterThanOrEqual(beforeParse);
		expect(bookmark.createdAt).toBeLessThanOrEqual(afterParse);
		expect(bookmark.updatedAt).toBe(bookmark.createdAt);
	});

	it('should parse real-world Chrome bookmark export', () => {
		const html = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
			<TITLE>Bookmarks</TITLE>
			<H1>Bookmarks</H1>
			<DL><p>
				<DT><H3 ADD_DATE="1640000000" LAST_MODIFIED="1650000000">Bookmarks Bar</H3>
				<DL><p>
					<DT><A HREF="https://github.com" ADD_DATE="1640000001" ICON="data:image/png;base64,github">GitHub</A>
					<DT><H3 ADD_DATE="1640000002">Dev Resources</H3>
					<DL><p>
						<DT><A HREF="https://stackoverflow.com" ADD_DATE="1640000003">Stack Overflow</A>
						<DD>Q&A for developers
					</DL><p>
				</DL><p>
			</DL><p>
		`;

		const result = parseNetscapeBookmarks(html);
		expect(result.folders).toHaveLength(2);
		expect(result.bookmarks).toHaveLength(2);
		expect(result.errors).toHaveLength(0);

		// Check folder hierarchy
		const bookmarksBar = result.folders.find((f) => f.name === 'Bookmarks Bar')!;
		const devResources = result.folders.find((f) => f.name === 'Dev Resources')!;
		expect(bookmarksBar.parentId).toBeNull();
		expect(devResources.parentId).toBe(bookmarksBar.id);

		// Check bookmarks
		const github = result.bookmarks.find((b) => b.url === 'https://github.com')!;
		const stackoverflow = result.bookmarks.find((b) => b.url === 'https://stackoverflow.com')!;
		expect(github.folderId).toBe(bookmarksBar.id);
		expect(stackoverflow.folderId).toBe(devResources.id);
		expect(stackoverflow.description).toBe('Q&A for developers');
	});
});
