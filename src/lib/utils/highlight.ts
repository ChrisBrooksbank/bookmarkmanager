/**
 * Utility functions for highlighting search matches in text
 */

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes HTML special characters so untrusted text can be rendered with {@html}
 */
function escapeHTML(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Highlights matching text in a string by wrapping it with a mark element.
 * The text is HTML-escaped first, so the result is safe to render with {@html}
 * even when it comes from untrusted sources (page titles, imported files).
 * @param text - The text to search in
 * @param query - The search query to highlight
 * @returns HTML string with highlighted matches
 */
export function highlightText(text: string, query: string): string {
	if (!query.trim()) {
		return escapeHTML(text);
	}

	const regex = new RegExp(`(${escapeRegex(query.trim())})`, 'gi');

	// split() with a capture group puts matches at odd indexes
	return text
		.split(regex)
		.map((part, index) =>
			index % 2 === 1
				? `<mark class="bg-yellow-200 dark:bg-yellow-600">${escapeHTML(part)}</mark>`
				: escapeHTML(part)
		)
		.join('');
}

/**
 * Checks if text contains the search query (case-insensitive)
 * @param text - The text to search in
 * @param query - The search query
 * @returns True if the text contains the query
 */
export function containsQuery(text: string | undefined, query: string): boolean {
	if (!text || !query.trim()) {
		return false;
	}

	return text.toLowerCase().includes(query.toLowerCase());
}
