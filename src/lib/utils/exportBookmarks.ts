import type { Bookmark, Folder, Tag } from '$lib/types';

/**
 * Resolve a bookmark's tag IDs to display names. Unknown IDs fall back to the raw ID
 * so nothing is silently dropped.
 */
function getTagNames(bookmark: Bookmark, tags: Tag[]): string[] {
	if (tags.length === 0) return [...bookmark.tags];
	const tagsById = new Map(tags.map((tag) => [tag.id, tag.name]));
	return bookmark.tags.map((tagId) => tagsById.get(tagId) ?? tagId);
}

/**
 * Keep only the folders needed to place the given bookmarks (their folders and ancestors).
 * Useful when exporting a filtered or selected subset.
 */
export function getFoldersForBookmarks(bookmarks: Bookmark[], folders: Folder[]): Folder[] {
	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
	const neededIds = new Set<string>();

	for (const bookmark of bookmarks) {
		let currentId = bookmark.folderId ?? null;
		while (currentId && !neededIds.has(currentId)) {
			const folder = foldersById.get(currentId);
			if (!folder) break;
			neededIds.add(currentId);
			currentId = folder.parentId ?? null;
		}
	}

	return folders.filter((folder) => neededIds.has(folder.id));
}

/**
 * Options for exporting bookmarks
 */
export interface ExportOptions {
	/** Title for the bookmark file */
	title?: string;
	/** Include folder structure */
	includeFolders?: boolean;
	/** Tags used to resolve bookmark tag IDs to names (exported as a TAGS attribute) */
	tags?: Tag[];
}

/**
 * Export bookmarks to Netscape Bookmark HTML format (compatible with all browsers)
 * @param bookmarks - Array of bookmarks to export
 * @param folders - Array of folders to export
 * @param options - Export options
 * @returns HTML string in Netscape Bookmark format
 */
export function exportBookmarksToHTML(
	bookmarks: Bookmark[],
	folders: Folder[],
	options: ExportOptions = {}
): string {
	const { title = 'Bookmarks', includeFolders = true, tags = [] } = options;

	// Build folder hierarchy map
	const folderMap = new Map<string, Folder>();
	folders.forEach((folder) => folderMap.set(folder.id, folder));

	// Build folder children map
	const folderChildren = new Map<string | null, Folder[]>();
	folders.forEach((folder) => {
		const parentId = folder.parentId || null;
		if (!folderChildren.has(parentId)) {
			folderChildren.set(parentId, []);
		}
		folderChildren.get(parentId)!.push(folder);
	});

	// Build bookmark-to-folder map
	const bookmarksByFolder = new Map<string | null, Bookmark[]>();
	bookmarks.forEach((bookmark) => {
		// Bookmarks whose folder isn't being exported (or no longer exists) go to the root
		// instead of being silently dropped from the file
		const folderId =
			bookmark.folderId && folderMap.has(bookmark.folderId) ? bookmark.folderId : null;
		if (!bookmarksByFolder.has(folderId)) {
			bookmarksByFolder.set(folderId, []);
		}
		bookmarksByFolder.get(folderId)!.push(bookmark);
	});

	// Helper to escape HTML special characters
	const escapeHTML = (str: string): string => {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	};

	// Helper to format timestamp to Unix timestamp (seconds)
	const formatTimestamp = (timestamp: number): string => {
		return Math.floor(timestamp / 1000).toString();
	};

	// Helper to render a single bookmark
	const renderBookmark = (bookmark: Bookmark): string => {
		const timestamp = formatTimestamp(bookmark.createdAt);
		const icon = bookmark.faviconUrl ? ` ICON="${escapeHTML(bookmark.faviconUrl)}"` : '';
		const tagNames = getTagNames(bookmark, tags);
		const tagsAttr = tagNames.length > 0 ? ` TAGS="${escapeHTML(tagNames.join(','))}"` : '';
		const description = bookmark.description
			? `\n        <DD>${escapeHTML(bookmark.description)}`
			: '';
		const notes = bookmark.notes ? `\n        <DD>Notes: ${escapeHTML(bookmark.notes)}` : '';

		return `        <DT><A HREF="${escapeHTML(bookmark.url)}" ADD_DATE="${timestamp}"${icon}${tagsAttr}>${escapeHTML(bookmark.title)}</A>${description}${notes}`;
	};

	// Recursive function to render a folder and its contents
	const renderFolder = (folderId: string | null, indent: string): string => {
		let html = '';

		// If includeFolders is false, render all bookmarks at the root level
		if (!includeFolders && folderId === null) {
			bookmarks.forEach((bookmark) => {
				html += `${indent}${renderBookmark(bookmark)}\n`;
			});
			return html;
		}

		// Render bookmarks in this folder
		const bookmarksInFolder = bookmarksByFolder.get(folderId) || [];
		bookmarksInFolder.forEach((bookmark) => {
			html += `${indent}${renderBookmark(bookmark)}\n`;
		});

		// Render child folders
		if (includeFolders) {
			const children = folderChildren.get(folderId) || [];
			children.forEach((folder) => {
				const timestamp = formatTimestamp(folder.createdAt);
				html += `${indent}<DT><H3 ADD_DATE="${timestamp}">${escapeHTML(folder.name)}</H3>\n`;
				html += `${indent}<DL><p>\n`;
				html += renderFolder(folder.id, indent + '    ');
				html += `${indent}</DL><p>\n`;
			});
		}

		return html;
	};

	// Build the complete HTML document
	let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
	html += '<!-- This is an automatically generated file.\n';
	html += '     It will be read and overwritten.\n';
	html += '     DO NOT EDIT! -->\n';
	html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
	html += `<TITLE>${escapeHTML(title)}</TITLE>\n`;
	html += `<H1>${escapeHTML(title)}</H1>\n`;
	html += '<DL><p>\n';

	// Render all bookmarks and folders starting from the root
	html += renderFolder(null, '    ');

	html += '</DL><p>\n';

	return html;
}

/**
 * Download bookmarks as an HTML file
 * @param bookmarks - Array of bookmarks to export
 * @param folders - Array of folders to export
 * @param filename - Name of the file to download
 * @param options - Export options
 */
export function downloadBookmarksHTML(
	bookmarks: Bookmark[],
	folders: Folder[],
	filename: string = 'bookmarks.html',
	options: ExportOptions = {}
): void {
	const html = exportBookmarksToHTML(bookmarks, folders, options);
	const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL object
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export data structure for JSON format
 */
export interface BookmarksExportData {
	/** Version of the export format */
	version: string;
	/** Timestamp when the export was created */
	exportedAt: number;
	/** Array of bookmarks */
	bookmarks: Bookmark[];
	/** Array of folders */
	folders: Folder[];
	/** Array of tags referenced by bookmark tag IDs */
	tags?: Tag[];
}

/**
 * Export bookmarks to JSON format with full data including tags, folders, and metadata
 * @param bookmarks - Array of bookmarks to export
 * @param folders - Array of folders to export
 * @returns JSON string with complete bookmark data
 */
export function exportBookmarksToJSON(
	bookmarks: Bookmark[],
	folders: Folder[],
	tags: Tag[] = []
): string {
	const usedTagIds = new Set(bookmarks.flatMap((bookmark) => bookmark.tags));
	const data: BookmarksExportData = {
		version: '1.1',
		exportedAt: Date.now(),
		bookmarks,
		folders,
		tags: tags.filter((tag) => usedTagIds.has(tag.id))
	};

	return JSON.stringify(data, null, 2);
}

/**
 * Download bookmarks as a JSON file
 * @param bookmarks - Array of bookmarks to export
 * @param folders - Array of folders to export
 * @param filename - Name of the file to download
 */
export function downloadBookmarksJSON(
	bookmarks: Bookmark[],
	folders: Folder[],
	filename: string = 'bookmarks.json',
	tags: Tag[] = []
): void {
	const json = exportBookmarksToJSON(bookmarks, folders, tags);
	const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL object
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export bookmarks to CSV format (simplified: URL, title, folder, tags)
 * @param bookmarks - Array of bookmarks to export
 * @param folders - Array of folders to export
 * @returns CSV string with bookmarks data
 */
export function exportBookmarksToCSV(
	bookmarks: Bookmark[],
	folders: Folder[],
	tags: Tag[] = []
): string {
	// Build folder map for quick lookup
	const folderMap = new Map<string, Folder>();
	folders.forEach((folder) => folderMap.set(folder.id, folder));

	// Helper to get full folder path
	const getFolderPath = (folderId: string | null | undefined): string => {
		if (!folderId) return '';

		const path: string[] = [];
		let currentId: string | null | undefined = folderId;
		const seen = new Set<string>();

		while (currentId && !seen.has(currentId)) {
			seen.add(currentId);
			const folder = folderMap.get(currentId);
			if (!folder) break;
			path.unshift(folder.name);
			currentId = folder.parentId;
		}

		return path.join('/');
	};

	// Helper to escape CSV fields (handle quotes and commas)
	const escapeCSV = (str: string): string => {
		// If the field contains a comma, double quote, or newline, wrap it in quotes
		// and escape any internal quotes by doubling them
		if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	// CSV header
	const header = 'URL,Title,Folder,Tags,Description,Notes,Created At';
	const rows: string[] = [header];

	// Add each bookmark as a row
	bookmarks.forEach((bookmark) => {
		const url = escapeCSV(bookmark.url);
		const title = escapeCSV(bookmark.title);
		const folder = escapeCSV(getFolderPath(bookmark.folderId));
		const tagNames = escapeCSV(getTagNames(bookmark, tags).join(', '));
		const description = escapeCSV(bookmark.description || '');
		const notes = escapeCSV(bookmark.notes || '');
		const createdAt = escapeCSV(new Date(bookmark.createdAt).toISOString());

		rows.push(`${url},${title},${folder},${tagNames},${description},${notes},${createdAt}`);
	});

	return rows.join('\n');
}

/**
 * Download bookmarks as a CSV file
 * @param bookmarks - Array of bookmarks to export
 * @param folders - Array of folders to export
 * @param filename - Name of the file to download
 */
export function downloadBookmarksCSV(
	bookmarks: Bookmark[],
	folders: Folder[],
	filename: string = 'bookmarks.csv',
	tags: Tag[] = []
): void {
	const csv = exportBookmarksToCSV(bookmarks, folders, tags);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL object
	setTimeout(() => URL.revokeObjectURL(url), 100);
}
