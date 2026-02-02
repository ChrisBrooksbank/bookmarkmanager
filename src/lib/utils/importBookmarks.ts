import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
import { foldersStore } from '$lib/stores/folders.svelte';
import { parseNetscapeBookmarks, validateBookmarkHTML } from './bookmarkParser';

export interface ImportOptions {
	/** How to handle duplicate URLs: 'skip' | 'replace' | 'keep' */
	duplicateHandling?: 'skip' | 'replace' | 'keep';
	/** Optional callback for progress updates (current, total) */
	onProgress?: (current: number, total: number) => void;
}

export interface ImportResult {
	/** Number of bookmarks imported */
	bookmarksImported: number;
	/** Number of folders imported */
	foldersImported: number;
	/** Number of bookmarks skipped (duplicates) */
	bookmarksSkipped: number;
	/** Number of bookmarks replaced (duplicates) */
	bookmarksReplaced: number;
	/** Errors encountered during import */
	errors: string[];
}

/**
 * Import bookmarks from HTML file with folder structure preservation
 * @param html - The HTML content to import
 * @param options - Import options (duplicate handling, progress callback)
 * @returns Import result with counts and errors
 */
export async function importBookmarksFromHTML(
	html: string,
	options: ImportOptions = {}
): Promise<ImportResult> {
	const { duplicateHandling = 'skip', onProgress } = options;

	const result: ImportResult = {
		bookmarksImported: 0,
		foldersImported: 0,
		bookmarksSkipped: 0,
		bookmarksReplaced: 0,
		errors: []
	};

	// Validate HTML
	const validation = validateBookmarkHTML(html);
	if (!validation.isValid) {
		result.errors.push(validation.error || 'Invalid bookmark file');
		return result;
	}

	// Parse HTML
	const parseResult = parseNetscapeBookmarks(html);
	result.errors.push(...parseResult.errors);

	if (parseResult.bookmarks.length === 0 && parseResult.folders.length === 0) {
		result.errors.push('No bookmarks or folders found in file');
		return result;
	}

	// Import folders first (to establish hierarchy)
	for (let i = 0; i < parseResult.folders.length; i++) {
		const folder = parseResult.folders[i];
		try {
			await foldersStore.add(folder);
			result.foldersImported++;
		} catch (error) {
			result.errors.push(
				`Failed to import folder "${folder.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Report progress for folders
		if (onProgress) {
			onProgress(i + 1, parseResult.folders.length + parseResult.bookmarks.length);
		}
	}

	// Get existing bookmarks to check for duplicates
	const existingBookmarks = bookmarksStore.items;
	const existingUrls = new Set(existingBookmarks.map((b) => b.url));

	// Import bookmarks
	for (let i = 0; i < parseResult.bookmarks.length; i++) {
		const bookmark = parseResult.bookmarks[i];
		const isDuplicate = existingUrls.has(bookmark.url);

		try {
			if (isDuplicate) {
				if (duplicateHandling === 'skip') {
					result.bookmarksSkipped++;
				} else if (duplicateHandling === 'replace') {
					// Find existing bookmark with same URL and update it
					const existing = existingBookmarks.find((b) => b.url === bookmark.url);
					if (existing) {
						await bookmarksStore.update({
							...bookmark,
							id: existing.id // Keep original ID
						});
						result.bookmarksReplaced++;
					}
				} else {
					// duplicateHandling === 'keep'
					await bookmarksStore.add(bookmark);
					result.bookmarksImported++;
				}
			} else {
				// Not a duplicate, just add it
				await bookmarksStore.add(bookmark);
				result.bookmarksImported++;
			}
		} catch (error) {
			result.errors.push(
				`Failed to import bookmark "${bookmark.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Report progress for bookmarks
		if (onProgress) {
			onProgress(
				parseResult.folders.length + i + 1,
				parseResult.folders.length + parseResult.bookmarks.length
			);
		}
	}

	return result;
}

/**
 * Import bookmarks from a File object (from file input)
 * @param file - The File object to import
 * @param options - Import options
 * @returns Import result with counts and errors
 */
export async function importBookmarksFromFile(
	file: File,
	options: ImportOptions = {}
): Promise<ImportResult> {
	try {
		const html = await file.text();
		return await importBookmarksFromHTML(html, options);
	} catch (error) {
		return {
			bookmarksImported: 0,
			foldersImported: 0,
			bookmarksSkipped: 0,
			bookmarksReplaced: 0,
			errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`]
		};
	}
}
