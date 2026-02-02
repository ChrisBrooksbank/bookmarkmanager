import { describe, it, expect } from 'vitest';
import {
	exportBookmarksToHTML,
	exportBookmarksToJSON,
	exportBookmarksToCSV
} from './exportBookmarks';
import type { Bookmark, Folder } from '$lib/types';
import type { BookmarksExportData } from './exportBookmarks';

describe('exportBookmarksToHTML', () => {
	it('should export empty bookmarks list with basic structure', () => {
		const html = exportBookmarksToHTML([], []);

		expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
		expect(html).toContain('<TITLE>Bookmarks</TITLE>');
		expect(html).toContain('<H1>Bookmarks</H1>');
		expect(html).toContain('<DL><p>');
		expect(html).toContain('</DL><p>');
	});

	it('should export a single bookmark without folder', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				description: 'A test site',
				tags: [],
				createdAt: 1609459200000, // 2021-01-01 00:00:00 UTC
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const html = exportBookmarksToHTML(bookmarks, []);

		expect(html).toContain('<A HREF="https://example.com"');
		expect(html).toContain('ADD_DATE="1609459200"');
		expect(html).toContain('>Example Site</A>');
		expect(html).toContain('<DD>A test site');
	});

	it('should export bookmark with favicon', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null,
				faviconUrl: 'https://example.com/favicon.ico'
			}
		];

		const html = exportBookmarksToHTML(bookmarks, []);

		expect(html).toContain('ICON="https://example.com/favicon.ico"');
	});

	it('should export bookmark without description', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const html = exportBookmarksToHTML(bookmarks, []);

		expect(html).toContain('>Example Site</A>');
		expect(html).not.toContain('<DD>');
	});

	it('should escape HTML special characters in title and URL', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com?foo=bar&baz=qux',
				title: 'Test <script>alert("XSS")</script>',
				description: 'Description with "quotes" and <tags>',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const html = exportBookmarksToHTML(bookmarks, []);

		expect(html).toContain('https://example.com?foo=bar&amp;baz=qux');
		expect(html).toContain('Test &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
		expect(html).toContain('Description with &quot;quotes&quot; and &lt;tags&gt;');
		expect(html).not.toContain('<script>');
	});

	it('should export bookmarks in a single folder', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://work1.com',
				title: 'Work Site 1',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			},
			{
				id: '2',
				url: 'https://work2.com',
				title: 'Work Site 2',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			}
		];

		const html = exportBookmarksToHTML(bookmarks, folders);

		expect(html).toContain('<H3 ADD_DATE="1609459200">Work</H3>');
		expect(html).toContain('https://work1.com');
		expect(html).toContain('https://work2.com');
	});

	it('should export nested folder hierarchy', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Programming',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'JavaScript',
				parentId: 'folder1',
				createdAt: 1609459200000
			},
			{
				id: 'folder3',
				name: 'Python',
				parentId: 'folder1',
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://javascript.com',
				title: 'JS Resource',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder2'
			},
			{
				id: '2',
				url: 'https://python.org',
				title: 'Python Docs',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder3'
			}
		];

		const html = exportBookmarksToHTML(bookmarks, folders);

		// Check for nested structure
		expect(html).toContain('<H3 ADD_DATE="1609459200">Programming</H3>');
		expect(html).toContain('<H3 ADD_DATE="1609459200">JavaScript</H3>');
		expect(html).toContain('<H3 ADD_DATE="1609459200">Python</H3>');

		// Check bookmarks are in correct folders
		const programmingIndex = html.indexOf('Programming');
		const jsIndex = html.indexOf('JavaScript');
		const pythonIndex = html.indexOf('Python');
		const jsResourceIndex = html.indexOf('JS Resource');
		const pythonDocsIndex = html.indexOf('Python Docs');

		expect(programmingIndex).toBeLessThan(jsIndex);
		expect(jsIndex).toBeLessThan(jsResourceIndex);
		expect(programmingIndex).toBeLessThan(pythonIndex);
		expect(pythonIndex).toBeLessThan(pythonDocsIndex);
	});

	it('should export bookmarks at root level alongside folders', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://root.com',
				title: 'Root Bookmark',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			},
			{
				id: '2',
				url: 'https://work.com',
				title: 'Work Bookmark',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			}
		];

		const html = exportBookmarksToHTML(bookmarks, folders);

		expect(html).toContain('Root Bookmark');
		expect(html).toContain('Work Bookmark');
		expect(html).toContain('<H3 ADD_DATE="1609459200">Work</H3>');
	});

	it('should use custom title when provided', () => {
		const html = exportBookmarksToHTML([], [], { title: 'My Custom Bookmarks' });

		expect(html).toContain('<TITLE>My Custom Bookmarks</TITLE>');
		expect(html).toContain('<H1>My Custom Bookmarks</H1>');
	});

	it('should export without folders when includeFolders is false', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://work.com',
				title: 'Work Bookmark',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			}
		];

		const html = exportBookmarksToHTML(bookmarks, folders, { includeFolders: false });

		expect(html).not.toContain('<H3');
		expect(html).not.toContain('Work</H3>');
		expect(html).toContain('Work Bookmark');
	});

	it('should handle multiple bookmarks at different levels', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Level 1',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'Level 2',
				parentId: 'folder1',
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://root.com',
				title: 'Root',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			},
			{
				id: '2',
				url: 'https://level1.com',
				title: 'Level 1',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			},
			{
				id: '3',
				url: 'https://level2.com',
				title: 'Level 2',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder2'
			}
		];

		const html = exportBookmarksToHTML(bookmarks, folders);

		// Verify all bookmarks are present
		expect(html).toContain('https://root.com');
		expect(html).toContain('https://level1.com');
		expect(html).toContain('https://level2.com');

		// Verify folder structure
		expect(html).toContain('Level 1</H3>');
		expect(html).toContain('Level 2</H3>');
	});

	it('should properly format timestamps', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1672531200000, // 2023-01-01 00:00:00 UTC
				updatedAt: 1672531200000,
				folderId: null
			}
		];

		const html = exportBookmarksToHTML(bookmarks, []);

		// Unix timestamp should be in seconds, not milliseconds
		expect(html).toContain('ADD_DATE="1672531200"');
	});
});

describe('exportBookmarksToJSON', () => {
	it('should export empty bookmarks list with version and timestamp', () => {
		const json = exportBookmarksToJSON([], []);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.version).toBe('1.0');
		expect(data.exportedAt).toBeGreaterThan(0);
		expect(data.bookmarks).toEqual([]);
		expect(data.folders).toEqual([]);
	});

	it('should export a single bookmark with all fields', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				description: 'A test site',
				tags: ['tag1', 'tag2'],
				createdAt: 1609459200000,
				updatedAt: 1609459300000,
				folderId: null,
				faviconUrl: 'https://example.com/favicon.ico'
			}
		];

		const json = exportBookmarksToJSON(bookmarks, []);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.bookmarks).toHaveLength(1);
		expect(data.bookmarks[0]).toEqual(bookmarks[0]);
		expect(data.bookmarks[0].id).toBe('1');
		expect(data.bookmarks[0].url).toBe('https://example.com');
		expect(data.bookmarks[0].title).toBe('Example Site');
		expect(data.bookmarks[0].description).toBe('A test site');
		expect(data.bookmarks[0].tags).toEqual(['tag1', 'tag2']);
		expect(data.bookmarks[0].createdAt).toBe(1609459200000);
		expect(data.bookmarks[0].updatedAt).toBe(1609459300000);
		expect(data.bookmarks[0].faviconUrl).toBe('https://example.com/favicon.ico');
	});

	it('should export multiple bookmarks', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example1.com',
				title: 'Example 1',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			},
			{
				id: '2',
				url: 'https://example2.com',
				title: 'Example 2',
				tags: ['tag1'],
				createdAt: 1609459300000,
				updatedAt: 1609459300000,
				folderId: 'folder1'
			}
		];

		const json = exportBookmarksToJSON(bookmarks, []);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.bookmarks).toHaveLength(2);
		expect(data.bookmarks[0].id).toBe('1');
		expect(data.bookmarks[1].id).toBe('2');
	});

	it('should export folders with hierarchy', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'Projects',
				parentId: 'folder1',
				createdAt: 1609459300000
			}
		];

		const json = exportBookmarksToJSON([], folders);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.folders).toHaveLength(2);
		expect(data.folders[0]).toEqual(folders[0]);
		expect(data.folders[1]).toEqual(folders[1]);
		expect(data.folders[1].parentId).toBe('folder1');
	});

	it('should export complete bookmark data with folders and tags', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Programming',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'JavaScript',
				parentId: 'folder1',
				createdAt: 1609459300000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://javascript.info',
				title: 'JavaScript Tutorial',
				description: 'Learn JS',
				tags: ['tutorial', 'javascript', 'programming'],
				createdAt: 1609459400000,
				updatedAt: 1609459500000,
				folderId: 'folder2',
				faviconUrl: 'https://javascript.info/favicon.ico'
			},
			{
				id: '2',
				url: 'https://mdn.mozilla.org',
				title: 'MDN Web Docs',
				tags: ['reference', 'documentation'],
				createdAt: 1609459600000,
				updatedAt: 1609459600000,
				folderId: 'folder1'
			}
		];

		const json = exportBookmarksToJSON(bookmarks, folders);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.version).toBe('1.0');
		expect(data.exportedAt).toBeGreaterThan(0);
		expect(data.bookmarks).toHaveLength(2);
		expect(data.folders).toHaveLength(2);

		// Verify bookmark references to folders
		expect(data.bookmarks[0].folderId).toBe('folder2');
		expect(data.bookmarks[1].folderId).toBe('folder1');

		// Verify all bookmark data is preserved
		expect(data.bookmarks[0].tags).toEqual(['tutorial', 'javascript', 'programming']);
		expect(data.bookmarks[0].description).toBe('Learn JS');
	});

	it('should produce valid JSON that can be parsed', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const json = exportBookmarksToJSON(bookmarks, []);

		// Should not throw an error
		expect(() => JSON.parse(json)).not.toThrow();

		// Should be formatted with indentation (pretty-printed)
		expect(json).toContain('\n');
		expect(json).toContain('  '); // 2-space indentation
	});

	it('should preserve special characters and unicode in JSON', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com?foo=bar&baz=qux',
				title: 'Test "quotes" and émojis 🎉',
				description: 'Special chars: <>&"\' and unicode: 中文',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const json = exportBookmarksToJSON(bookmarks, []);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.bookmarks[0].url).toBe('https://example.com?foo=bar&baz=qux');
		expect(data.bookmarks[0].title).toBe('Test "quotes" and émojis 🎉');
		expect(data.bookmarks[0].description).toBe('Special chars: <>&"\' and unicode: 中文');
	});

	it('should handle bookmarks without optional fields', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const json = exportBookmarksToJSON(bookmarks, []);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.bookmarks[0].description).toBeUndefined();
		expect(data.bookmarks[0].faviconUrl).toBeUndefined();
	});

	it('should handle large datasets', () => {
		const bookmarks: Bookmark[] = Array.from({ length: 1000 }, (_, i) => ({
			id: `bookmark-${i}`,
			url: `https://example${i}.com`,
			title: `Bookmark ${i}`,
			tags: [`tag${i % 10}`],
			createdAt: 1609459200000 + i,
			updatedAt: 1609459200000 + i,
			folderId: i % 5 === 0 ? `folder-${Math.floor(i / 5)}` : null
		}));

		const folders: Folder[] = Array.from({ length: 200 }, (_, i) => ({
			id: `folder-${i}`,
			name: `Folder ${i}`,
			parentId: i > 0 ? `folder-${Math.floor(i / 2)}` : null,
			createdAt: 1609459200000 + i
		}));

		const json = exportBookmarksToJSON(bookmarks, folders);
		const data: BookmarksExportData = JSON.parse(json);

		expect(data.bookmarks).toHaveLength(1000);
		expect(data.folders).toHaveLength(200);
	});

	it('should maintain referential integrity between bookmarks and folders', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Parent',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			}
		];

		const json = exportBookmarksToJSON(bookmarks, folders);
		const data: BookmarksExportData = JSON.parse(json);

		// Find the bookmark and verify its folder reference
		const bookmark = data.bookmarks.find((b) => b.id === '1');
		const folder = data.folders.find((f) => f.id === 'folder1');

		expect(bookmark?.folderId).toBe(folder?.id);
	});
});

describe('exportBookmarksToCSV', () => {
	it('should export empty bookmarks list with header only', () => {
		const csv = exportBookmarksToCSV([], []);

		expect(csv).toBe('URL,Title,Folder,Tags,Description,Notes,Created At');
	});

	it('should export a single bookmark without folder or tags', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				description: 'A test site',
				tags: [],
				createdAt: 1609459200000, // 2021-01-01 00:00:00 UTC
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines).toHaveLength(2);
		expect(lines[0]).toBe('URL,Title,Folder,Tags,Description,Notes,Created At');
		expect(lines[1]).toContain('https://example.com');
		expect(lines[1]).toContain('Example Site');
		expect(lines[1]).toContain('A test site');
		expect(lines[1]).toContain('2021-01-01T00:00:00.000Z');
	});

	it('should export bookmark with tags', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				tags: ['tag1', 'tag2', 'tag3'],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('tag1, tag2, tag3');
	});

	it('should export bookmark in a folder', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://work.com',
				title: 'Work Site',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, folders);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('Work');
	});

	it('should export bookmark with nested folder path', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Programming',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'JavaScript',
				parentId: 'folder1',
				createdAt: 1609459200000
			},
			{
				id: 'folder3',
				name: 'React',
				parentId: 'folder2',
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://react.dev',
				title: 'React Docs',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder3'
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, folders);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('Programming/JavaScript/React');
	});

	it('should escape commas in fields', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Site with, comma',
				description: 'Description, with, commas',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('"Site with, comma"');
		expect(lines[1]).toContain('"Description, with, commas"');
	});

	it('should escape double quotes in fields', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Site with "quotes"',
				description: 'Description with "quotes"',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('"Site with ""quotes"""');
		expect(lines[1]).toContain('"Description with ""quotes"""');
	});

	it('should escape newlines in fields', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Site with\nnewline',
				description: 'Description with\nnewline',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);

		expect(csv).toContain('"Site with\nnewline"');
		expect(csv).toContain('"Description with\nnewline"');
	});

	it('should handle bookmark without description', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example Site',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		// Description field should be empty but present
		const parts = lines[1].split(',');
		expect(parts[4]).toBe(''); // Description should be empty
	});

	it('should export multiple bookmarks', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example1.com',
				title: 'Example 1',
				tags: ['tag1'],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			},
			{
				id: '2',
				url: 'https://example2.com',
				title: 'Example 2',
				tags: ['tag2'],
				createdAt: 1609459300000,
				updatedAt: 1609459300000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines).toHaveLength(3); // Header + 2 bookmarks
		expect(lines[1]).toContain('https://example1.com');
		expect(lines[2]).toContain('https://example2.com');
	});

	it('should export bookmarks in different folders', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'Personal',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://work.com',
				title: 'Work Site',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			},
			{
				id: '2',
				url: 'https://personal.com',
				title: 'Personal Site',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder2'
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, folders);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('Work');
		expect(lines[2]).toContain('Personal');
	});

	it('should format timestamp as ISO 8601 string', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1672531200000, // 2023-01-01 00:00:00 UTC
				updatedAt: 1672531200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('2023-01-01T00:00:00.000Z');
	});

	it('should handle bookmarks with complex data', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Programming',
				parentId: null,
				createdAt: 1609459200000
			},
			{
				id: 'folder2',
				name: 'JavaScript',
				parentId: 'folder1',
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://javascript.info',
				title: 'JavaScript Tutorial',
				description: 'Learn JS with examples, exercises',
				tags: ['tutorial', 'javascript', 'programming'],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder2'
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, folders);
		const lines = csv.split('\n');

		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain('https://javascript.info');
		expect(lines[1]).toContain('JavaScript Tutorial');
		expect(lines[1]).toContain('Programming/JavaScript');
		expect(lines[1]).toContain('tutorial, javascript, programming');
		expect(lines[1]).toContain('Learn JS with examples, exercises');
	});

	it('should handle folder path with commas in folder names', () => {
		const folders: Folder[] = [
			{
				id: 'folder1',
				name: 'Work, Projects',
				parentId: null,
				createdAt: 1609459200000
			}
		];

		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'folder1'
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, folders);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('"Work, Projects"');
	});

	it('should handle missing folder references gracefully', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Example',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: 'nonexistent-folder'
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		// Should not throw an error and folder should be empty
		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain('https://example.com');
	});

	it('should handle large datasets', () => {
		const bookmarks: Bookmark[] = Array.from({ length: 100 }, (_, i) => ({
			id: `bookmark-${i}`,
			url: `https://example${i}.com`,
			title: `Bookmark ${i}`,
			tags: [`tag${i % 10}`],
			createdAt: 1609459200000 + i,
			updatedAt: 1609459200000 + i,
			folderId: null
		}));

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines).toHaveLength(101); // Header + 100 bookmarks
	});

	it('should handle unicode and special characters', () => {
		const bookmarks: Bookmark[] = [
			{
				id: '1',
				url: 'https://example.com',
				title: 'Unicode test 中文 émojis 🎉',
				description: 'Special chars: <>&"\' unicode: 日本語',
				tags: [],
				createdAt: 1609459200000,
				updatedAt: 1609459200000,
				folderId: null
			}
		];

		const csv = exportBookmarksToCSV(bookmarks, []);
		const lines = csv.split('\n');

		expect(lines[1]).toContain('Unicode test 中文 émojis 🎉');
		// The description contains a double quote, so it should be wrapped in quotes and escaped
		expect(lines[1]).toContain('Special chars: <>&');
		expect(lines[1]).toContain('unicode: 日本語');
	});
});
