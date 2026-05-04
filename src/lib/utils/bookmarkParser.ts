import type { Bookmark, Folder } from '$lib/types';

export type BookmarkImportFormat =
	| 'netscape-html'
	| 'bookmark-manager-json'
	| 'chrome-json'
	| 'csv'
	| 'url-list'
	| 'unknown';

/**
 * Result of parsing an HTML bookmark file
 */
export interface ParseResult {
	/** Parsed bookmarks */
	bookmarks: Bookmark[];
	/** Parsed folders */
	folders: Folder[];
	/** Tag names keyed by parsed bookmark ID */
	tagNamesByBookmarkId: Map<string, string[]>;
	/** Detected source format */
	format: BookmarkImportFormat;
	/** Errors encountered during parsing */
	errors: string[];
}

/**
 * Temporary structure for building folder hierarchy during parsing
 */
interface ParsedFolder {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: number;
}

interface ChromeBookmarkNode {
	type?: string;
	name?: string;
	url?: string;
	date_added?: string;
	children?: ChromeBookmarkNode[];
}

const CHROME_EPOCH_OFFSET_MS = 11644473600000;

function createEmptyParseResult(format: BookmarkImportFormat): ParseResult {
	return {
		bookmarks: [],
		folders: [],
		tagNamesByBookmarkId: new Map(),
		format,
		errors: []
	};
}

function isWebUrl(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://');
}

function timestampFromUnixSeconds(value: string | null): number {
	if (!value) return Date.now();
	const timestamp = Number.parseInt(value, 10);
	return Number.isFinite(timestamp) && timestamp > 0 ? timestamp * 1000 : Date.now();
}

function timestampFromChromeWebkit(value: string | undefined): number {
	if (!value) return Date.now();
	const timestamp = Number.parseInt(value, 10);
	return Number.isFinite(timestamp) && timestamp > 0
		? Math.max(0, timestamp / 1000 - CHROME_EPOCH_OFFSET_MS)
		: Date.now();
}

function getDelimitedTags(value: string | null | undefined): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

function createBookmark(input: {
	url: string;
	title?: string;
	description?: string;
	notes?: string;
	folderId?: string | null;
	createdAt?: number;
	faviconUrl?: string;
	ogImage?: string;
	tags?: string[];
}): { bookmark: Bookmark; tagNames: string[] } {
	const createdAt = input.createdAt ?? Date.now();
	const bookmark: Bookmark = {
		id: crypto.randomUUID(),
		url: input.url,
		title: input.title?.trim() || input.url,
		description: input.description || undefined,
		notes: input.notes || undefined,
		folderId: input.folderId ?? null,
		tags: [],
		createdAt,
		updatedAt: createdAt,
		faviconUrl: input.faviconUrl || undefined,
		ogImage: input.ogImage || undefined
	};

	return { bookmark, tagNames: input.tags ?? [] };
}

/**
 * Parse Netscape bookmark HTML format (used by Chrome, Firefox, Edge, Safari)
 * @param html - The HTML content of the bookmark file
 * @returns Object with parsed bookmarks, folders, and any errors
 */
export function parseNetscapeBookmarks(html: string): ParseResult {
	const result = createEmptyParseResult('netscape-html');

	try {
		// Create a DOM parser
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		// Check for parsing errors
		const parserError = doc.querySelector('parsererror');
		if (parserError) {
			result.errors.push('Failed to parse HTML: Invalid HTML structure');
			return result;
		}

		// Find the main DL element (definition list)
		const mainDL = doc.querySelector('dl');
		if (!mainDL) {
			result.errors.push('Invalid bookmark file: No bookmark list found');
			return result;
		}

		// Track folder hierarchy as we parse
		const folderStack: ParsedFolder[] = [];
		let currentFolder: ParsedFolder | null = null;

		// Recursive function to parse a DL element
		const parseDL = (dl: Element) => {
			let currentElement = dl.firstElementChild;

			while (currentElement) {
				if (currentElement.tagName === 'DT') {
					const dt = currentElement;
					const firstChild = dt.firstElementChild;

					if (firstChild?.tagName === 'H3') {
						// This is a folder
						const folderName = firstChild.textContent?.trim() || 'Unnamed Folder';
						const addDate = firstChild.getAttribute('add_date');

						// Create folder
						const folder: ParsedFolder = {
							id: crypto.randomUUID(),
							name: folderName,
							parentId: currentFolder?.id || null,
							createdAt: timestampFromUnixSeconds(addDate)
						};

						result.folders.push(folder);

						// Check if there's a nested DL (folder contents)
						// The browser parser may place the DL inside the DT or as a sibling
						let nestedDL: Element | null = null;

						// First check if the DL is inside the DT (after the H3)
						const dlInsideDT = Array.from(dt.children).find((child) => child.tagName === 'DL');
						if (dlInsideDT) {
							nestedDL = dlInsideDT as Element;
						} else {
							// Otherwise check if it's a sibling
							const nextElement = dt.nextElementSibling;
							if (nextElement?.tagName === 'DL') {
								nestedDL = nextElement;
							}
						}

						if (nestedDL) {
							// Push current folder to stack and recurse
							if (currentFolder) {
								folderStack.push(currentFolder);
							}
							currentFolder = folder;
							parseDL(nestedDL);
							currentFolder = folderStack.pop() || null;

							// If the DL was a sibling, skip it in iteration
							if (nestedDL === dt.nextElementSibling) {
								currentElement = nestedDL.nextElementSibling;
								continue;
							}
						}
					} else if (firstChild?.tagName === 'A') {
						// This is a bookmark
						const anchor = firstChild as HTMLAnchorElement;
						const url = anchor.getAttribute('href') || '';
						const title = anchor.textContent?.trim() || 'Untitled';
						const addDate = anchor.getAttribute('add_date');
						const icon = anchor.getAttribute('icon');
						const iconUri = anchor.getAttribute('icon_uri');
						const tags = getDelimitedTags(anchor.getAttribute('tags'));

						// Skip invalid URLs
						if (!url || !isWebUrl(url)) {
							result.errors.push(`Skipped bookmark with invalid URL: ${title}`);
							currentElement = currentElement.nextElementSibling;
							continue;
						}

						// Extract description and notes from DD elements if present
						let description: string | undefined;
						let notes: string | undefined;
						let ddElement = dt.nextElementSibling;

						// Process all consecutive DD elements
						while (ddElement?.tagName === 'DD') {
							const ddText = ddElement.textContent?.trim();
							if (ddText) {
								// Check if this DD contains notes (our export format prefixes with "Notes: ")
								if (ddText.startsWith('Notes: ')) {
									notes = ddText.substring(7); // Remove "Notes: " prefix
								} else if (!description) {
									// First DD without "Notes: " prefix is the description
									description = ddText;
								}
							}
							ddElement = ddElement.nextElementSibling;
						}

						// Create bookmark
						const { bookmark, tagNames } = createBookmark({
							url,
							title,
							description,
							notes,
							folderId: currentFolder?.id || null,
							createdAt: timestampFromUnixSeconds(addDate),
							faviconUrl: icon || iconUri || undefined,
							tags
						});

						result.bookmarks.push(bookmark);
						if (tagNames.length > 0) {
							result.tagNamesByBookmarkId.set(bookmark.id, tagNames);
						}
					}
				}

				currentElement = currentElement.nextElementSibling;
			}
		};

		// Start parsing from the main DL
		parseDL(mainDL);
	} catch (error) {
		result.errors.push(
			`Unexpected error during parsing: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return result;
}

/**
 * Validate that a string appears to be a Netscape bookmark HTML file
 * @param content - The content to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateBookmarkHTML(content: string): { isValid: boolean; error?: string } {
	if (!content.trim()) {
		return { isValid: false, error: 'File is empty' };
	}

	// Check for DOCTYPE or HTML tag
	const hasDoctype = /<!DOCTYPE\s+NETSCAPE-Bookmark-file-1>/i.test(content);
	const hasHTML = /<html/i.test(content);

	if (!hasDoctype && !hasHTML) {
		return {
			isValid: false,
			error: 'File does not appear to be a valid bookmark HTML file'
		};
	}

	return { isValid: true };
}

export function parseBookmarkManagerJSON(content: string): ParseResult {
	const result = createEmptyParseResult('bookmark-manager-json');

	try {
		const data = JSON.parse(content) as {
			bookmarks?: Bookmark[];
			folders?: Folder[];
		};

		if (!Array.isArray(data.bookmarks)) {
			result.errors.push('JSON file does not contain a bookmarks array');
			return result;
		}

		const folderIds = new Set<string>();
		if (Array.isArray(data.folders)) {
			for (const folder of data.folders) {
				if (!folder?.id || !folder.name) continue;
				const importedFolder: Folder = {
					id: crypto.randomUUID(),
					name: folder.name,
					parentId: folder.parentId ?? null,
					createdAt: folder.createdAt || Date.now()
				};
				folderIds.add(folder.id);
				result.folders.push(importedFolder);
			}
		}

		const folderIdMap = new Map<string, string>();
		Array.from(folderIds).forEach((oldId, index) => {
			const folder = result.folders[index];
			if (folder) folderIdMap.set(oldId, folder.id);
		});
		for (const folder of result.folders) {
			if (folder.parentId) {
				folder.parentId = folderIdMap.get(folder.parentId) ?? null;
			}
		}

		for (const item of data.bookmarks) {
			if (!item?.url || !isWebUrl(item.url)) {
				result.errors.push(`Skipped bookmark with invalid URL: ${item?.title || 'Untitled'}`);
				continue;
			}

			const { bookmark } = createBookmark({
				url: item.url,
				title: item.title,
				description: item.description,
				notes: item.notes,
				folderId: item.folderId ? (folderIdMap.get(item.folderId) ?? null) : null,
				createdAt: item.createdAt || Date.now(),
				faviconUrl: item.faviconUrl,
				ogImage: item.ogImage
			});
			result.bookmarks.push(bookmark);
		}
	} catch (error) {
		result.errors.push(
			`Failed to parse JSON bookmark file: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return result;
}

export function parseChromeBookmarksJSON(content: string): ParseResult {
	const result = createEmptyParseResult('chrome-json');

	try {
		const data = JSON.parse(content) as {
			roots?: Record<string, ChromeBookmarkNode>;
		};

		if (!data.roots || typeof data.roots !== 'object') {
			result.errors.push('Chrome JSON file does not contain bookmark roots');
			return result;
		}

		const parseNode = (node: ChromeBookmarkNode, parentId: string | null) => {
			if (node.type === 'folder') {
				const folder: Folder = {
					id: crypto.randomUUID(),
					name: node.name?.trim() || 'Unnamed Folder',
					parentId,
					createdAt: timestampFromChromeWebkit(node.date_added)
				};
				result.folders.push(folder);

				for (const child of node.children ?? []) {
					parseNode(child, folder.id);
				}
				return;
			}

			if (node.type === 'url') {
				if (!node.url || !isWebUrl(node.url)) {
					result.errors.push(`Skipped bookmark with invalid URL: ${node.name || 'Untitled'}`);
					return;
				}

				const { bookmark } = createBookmark({
					url: node.url,
					title: node.name,
					folderId: parentId,
					createdAt: timestampFromChromeWebkit(node.date_added)
				});
				result.bookmarks.push(bookmark);
			}
		};

		for (const [rootKey, rootNode] of Object.entries(data.roots)) {
			if (rootKey === 'sync_transaction_version') continue;
			if (!rootNode.children || rootNode.children.length === 0) continue;
			parseNode({ ...rootNode, type: 'folder', name: rootNode.name || rootKey }, null);
		}
	} catch (error) {
		result.errors.push(
			`Failed to parse Chrome bookmark JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return result;
}

function parseCSVRows(content: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		const nextChar = content[i + 1];

		if (char === '"' && inQuotes && nextChar === '"') {
			field += '"';
			i++;
		} else if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			row.push(field);
			field = '';
		} else if ((char === '\n' || char === '\r') && !inQuotes) {
			if (char === '\r' && nextChar === '\n') i++;
			row.push(field);
			if (row.some((value) => value.trim() !== '')) rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	row.push(field);
	if (row.some((value) => value.trim() !== '')) rows.push(row);
	return rows;
}

export function parseBookmarksCSV(content: string): ParseResult {
	const result = createEmptyParseResult('csv');
	const rows = parseCSVRows(content);
	if (rows.length === 0) {
		result.errors.push('CSV file is empty');
		return result;
	}

	const headers = rows[0].map((header) => header.trim().toLowerCase());
	const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
	const urlIndex = indexOf('url', 'href', 'link');
	const titleIndex = indexOf('title', 'name');
	const folderIndex = indexOf('folder', 'folder path', 'path');
	const tagsIndex = indexOf('tags', 'tag');
	const descriptionIndex = indexOf('description', 'desc');
	const notesIndex = indexOf('notes', 'note');
	const createdIndex = indexOf('created at', 'created', 'add_date', 'date');

	if (urlIndex === -1) {
		result.errors.push('CSV file needs a URL column');
		return result;
	}

	const folderByPath = new Map<string, Folder>();
	const ensureFolderPath = (path: string): string | null => {
		if (!path.trim()) return null;
		let parentId: string | null = null;
		let fullPath = '';

		for (const part of path
			.split('/')
			.map((value) => value.trim())
			.filter(Boolean)) {
			fullPath = fullPath ? `${fullPath}/${part}` : part;
			let folder = folderByPath.get(fullPath);
			if (!folder) {
				folder = {
					id: crypto.randomUUID(),
					name: part,
					parentId,
					createdAt: Date.now()
				};
				folderByPath.set(fullPath, folder);
				result.folders.push(folder);
			}
			parentId = folder.id;
		}

		return parentId;
	};

	for (const row of rows.slice(1)) {
		const url = row[urlIndex]?.trim() ?? '';
		if (!url || !isWebUrl(url)) {
			result.errors.push(`Skipped CSV row with invalid URL: ${url || 'empty URL'}`);
			continue;
		}

		const createdAtValue = createdIndex >= 0 ? Date.parse(row[createdIndex]) : Number.NaN;
		const folderId = folderIndex >= 0 ? ensureFolderPath(row[folderIndex] ?? '') : null;
		const tags = tagsIndex >= 0 ? getDelimitedTags(row[tagsIndex]) : [];
		const { bookmark, tagNames } = createBookmark({
			url,
			title: titleIndex >= 0 ? row[titleIndex] : url,
			description: descriptionIndex >= 0 ? row[descriptionIndex] : undefined,
			notes: notesIndex >= 0 ? row[notesIndex] : undefined,
			folderId,
			createdAt: Number.isFinite(createdAtValue) ? createdAtValue : Date.now(),
			tags
		});
		result.bookmarks.push(bookmark);
		if (tagNames.length > 0) result.tagNamesByBookmarkId.set(bookmark.id, tagNames);
	}

	return result;
}

export function parseUrlList(content: string): ParseResult {
	const result = createEmptyParseResult('url-list');
	const lines = content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		const [urlCandidate, ...titleParts] = line.split(/\s+/);
		if (!urlCandidate || !isWebUrl(urlCandidate)) {
			result.errors.push(`Skipped line without a web URL: ${line}`);
			continue;
		}

		const { bookmark } = createBookmark({
			url: urlCandidate,
			title: titleParts.join(' ') || urlCandidate
		});
		result.bookmarks.push(bookmark);
	}

	if (result.bookmarks.length === 0 && result.errors.length === 0) {
		result.errors.push('No URLs found');
	}

	return result;
}

export function parseBookmarkFile(content: string, filename = ''): ParseResult {
	const trimmed = content.trim();
	if (!trimmed) {
		const result = createEmptyParseResult('unknown');
		result.errors.push('File is empty');
		return result;
	}

	const lowerFilename = filename.toLowerCase();
	if (/<!DOCTYPE\s+NETSCAPE-Bookmark-file-1>/i.test(trimmed) || /<dl[\s>]/i.test(trimmed)) {
		return parseNetscapeBookmarks(content);
	}

	if (trimmed.startsWith('{') || trimmed.startsWith('[') || lowerFilename.endsWith('.json')) {
		try {
			const data = JSON.parse(trimmed) as { bookmarks?: unknown; roots?: unknown };
			if (Array.isArray(data.bookmarks)) return parseBookmarkManagerJSON(content);
			if (data.roots) return parseChromeBookmarksJSON(content);
		} catch {
			const result = createEmptyParseResult('unknown');
			result.errors.push('JSON file could not be parsed');
			return result;
		}
	}

	if (lowerFilename.endsWith('.csv') || /^url\s*,/i.test(trimmed) || /^href\s*,/i.test(trimmed)) {
		return parseBookmarksCSV(content);
	}

	if (/https?:\/\//i.test(trimmed)) {
		return parseUrlList(content);
	}

	const result = createEmptyParseResult('unknown');
	result.errors.push('Unsupported bookmark file format');
	return result;
}
