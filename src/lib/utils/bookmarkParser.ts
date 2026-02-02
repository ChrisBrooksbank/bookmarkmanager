import type { Bookmark, Folder } from '$lib/types';

/**
 * Result of parsing an HTML bookmark file
 */
export interface ParseResult {
	/** Parsed bookmarks */
	bookmarks: Bookmark[];
	/** Parsed folders */
	folders: Folder[];
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

/**
 * Parse Netscape bookmark HTML format (used by Chrome, Firefox, Edge, Safari)
 * @param html - The HTML content of the bookmark file
 * @returns Object with parsed bookmarks, folders, and any errors
 */
export function parseNetscapeBookmarks(html: string): ParseResult {
	const bookmarks: Bookmark[] = [];
	const folders: Folder[] = [];
	const errors: string[] = [];

	try {
		// Create a DOM parser
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		// Check for parsing errors
		const parserError = doc.querySelector('parsererror');
		if (parserError) {
			errors.push('Failed to parse HTML: Invalid HTML structure');
			return { bookmarks, folders, errors };
		}

		// Find the main DL element (definition list)
		const mainDL = doc.querySelector('dl');
		if (!mainDL) {
			errors.push('Invalid bookmark file: No bookmark list found');
			return { bookmarks, folders, errors };
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
							createdAt: addDate ? parseInt(addDate) * 1000 : Date.now()
						};

						folders.push(folder);

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

						// Skip invalid URLs
						if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
							errors.push(`Skipped bookmark with invalid URL: ${title}`);
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
						const now = Date.now();
						const createdAt = addDate ? parseInt(addDate) * 1000 : now;

						const bookmark: Bookmark = {
							id: crypto.randomUUID(),
							url,
							title,
							description,
							notes,
							folderId: currentFolder?.id || null,
							tags: [],
							createdAt,
							updatedAt: createdAt,
							faviconUrl: icon || undefined
						};

						bookmarks.push(bookmark);
					}
				}

				currentElement = currentElement.nextElementSibling;
			}
		};

		// Start parsing from the main DL
		parseDL(mainDL);
	} catch (error) {
		errors.push(
			`Unexpected error during parsing: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return { bookmarks, folders, errors };
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
