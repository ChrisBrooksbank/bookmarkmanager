import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
import { foldersStore } from '$lib/stores/folders.svelte';
import { tagsStore } from '$lib/stores/tags.svelte';
import { parseBookmarkFile, type BookmarkImportFormat } from './bookmarkParser';
import type { Bookmark, Tag } from '$lib/types';

export interface ImportOptions {
	/** How to handle duplicate URLs: 'skip' | 'replace' | 'keep' */
	duplicateHandling?: 'skip' | 'replace' | 'keep';
	/** Create tags when imported formats carry tag names */
	importTags?: boolean;
	/** Optional callback for progress updates (current, total) */
	onProgress?: (current: number, total: number) => void;
}

export interface ImportResult {
	/** Number of bookmarks imported */
	bookmarksImported: number;
	/** Number of folders imported */
	foldersImported: number;
	/** Number of tags imported */
	tagsImported: number;
	/** Number of bookmarks skipped (duplicates) */
	bookmarksSkipped: number;
	/** Number of bookmarks replaced (duplicates) */
	bookmarksReplaced: number;
	/** Detected source format */
	format: BookmarkImportFormat;
	/** Number of bookmarks found before duplicate handling */
	bookmarksParsed: number;
	/** Number of folders found before import */
	foldersParsed: number;
	/** Errors encountered during import */
	errors: string[];
}

function normalizeUrlForDuplicate(url: string): string {
	try {
		const parsed = new URL(url);
		parsed.hash = '';
		return parsed.href.replace(/\/$/, '');
	} catch {
		return url.trim().toLowerCase();
	}
}

function createEmptyImportResult(format: BookmarkImportFormat = 'unknown'): ImportResult {
	return {
		bookmarksImported: 0,
		foldersImported: 0,
		tagsImported: 0,
		bookmarksSkipped: 0,
		bookmarksReplaced: 0,
		format,
		bookmarksParsed: 0,
		foldersParsed: 0,
		errors: []
	};
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
	return importBookmarksFromContent(html, options, 'bookmarks.html');
}

export async function importBookmarksFromContent(
	content: string,
	options: ImportOptions = {},
	filename = ''
): Promise<ImportResult> {
	const { duplicateHandling = 'skip', importTags = true, onProgress } = options;

	const parseResult = parseBookmarkFile(content, filename);
	const result = createEmptyImportResult(parseResult.format);
	result.bookmarksParsed = parseResult.bookmarks.length;
	result.foldersParsed = parseResult.folders.length;
	result.errors.push(...parseResult.errors);

	if (parseResult.bookmarks.length === 0 && parseResult.folders.length === 0) {
		result.errors.push('No bookmarks or folders found in file');
		return result;
	}

	const existingByUrl = new Map<string, Bookmark>();
	for (const bookmark of bookmarksStore.items) {
		if (!existingByUrl.has(normalizeUrlForDuplicate(bookmark.url))) {
			existingByUrl.set(normalizeUrlForDuplicate(bookmark.url), bookmark);
		}
	}

	const bookmarksToAdd: Bookmark[] = [];
	const bookmarksToUpdate: Bookmark[] = [];
	const bookmarksThatNeedTags: Bookmark[] = [];
	const totalWork =
		parseResult.folders.length +
		parseResult.bookmarks.length +
		parseResult.tagNamesByBookmarkId.size;
	let completedWork = 0;
	const reportProgress = (increment = 1) => {
		completedWork += increment;
		onProgress?.(Math.min(completedWork, totalWork), totalWork);
	};

	try {
		await foldersStore.addMany(parseResult.folders);
		result.foldersImported = parseResult.folders.length;
		for (let i = 0; i < parseResult.folders.length; i++) reportProgress();
	} catch (error) {
		result.errors.push(
			`Failed to import folders: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	for (const bookmark of parseResult.bookmarks) {
		const normalizedUrl = normalizeUrlForDuplicate(bookmark.url);
		const existing = existingByUrl.get(normalizedUrl);

		if (existing && duplicateHandling === 'skip') {
			result.bookmarksSkipped++;
			reportProgress();
			continue;
		}

		if (existing && duplicateHandling === 'replace') {
			const importedTagNames = parseResult.tagNamesByBookmarkId.get(bookmark.id);
			const updatedBookmark: Bookmark = {
				...bookmark,
				id: existing.id,
				tags: [...existing.tags],
				updatedAt: Date.now()
			};
			if (importedTagNames) {
				parseResult.tagNamesByBookmarkId.set(updatedBookmark.id, importedTagNames);
			}
			bookmarksToUpdate.push(updatedBookmark);
			bookmarksThatNeedTags.push(updatedBookmark);
			result.bookmarksReplaced++;
			reportProgress();
			continue;
		}

		bookmarksToAdd.push(bookmark);
		bookmarksThatNeedTags.push(bookmark);
		result.bookmarksImported++;
		if (duplicateHandling !== 'keep') {
			existingByUrl.set(normalizedUrl, bookmark);
		}
		reportProgress();
	}

	if (importTags && parseResult.tagNamesByBookmarkId.size > 0) {
		const tagsByName = new Map(tagsStore.items.map((tag) => [tag.name.toLowerCase(), tag]));
		const tagsToAdd: Tag[] = [];

		for (const bookmark of bookmarksThatNeedTags) {
			const tagNames = parseResult.tagNamesByBookmarkId.get(bookmark.id) ?? [];
			const tagIds: string[] = [];

			for (const tagName of tagNames) {
				const normalizedName = tagName.toLowerCase();
				let tag = tagsByName.get(normalizedName);
				if (!tag) {
					tag = { id: crypto.randomUUID(), name: tagName };
					tagsByName.set(normalizedName, tag);
					tagsToAdd.push(tag);
				}
				tagIds.push(tag.id);
			}

			if (tagIds.length > 0) {
				bookmark.tags = [...new Set([...bookmark.tags, ...tagIds])];
			}
			reportProgress();
		}

		try {
			await tagsStore.addMany(tagsToAdd);
			result.tagsImported = tagsToAdd.length;
		} catch (error) {
			result.errors.push(
				`Failed to import tags: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	try {
		await bookmarksStore.addMany(bookmarksToAdd);
	} catch (error) {
		result.bookmarksImported = 0;
		result.errors.push(
			`Failed to import bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	try {
		await bookmarksStore.updateMany(bookmarksToUpdate);
	} catch (error) {
		result.bookmarksReplaced = 0;
		result.errors.push(
			`Failed to replace bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
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
		const content = await file.text();
		return await importBookmarksFromContent(content, options, file.name);
	} catch (error) {
		return {
			...createEmptyImportResult(),
			errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`]
		};
	}
}
