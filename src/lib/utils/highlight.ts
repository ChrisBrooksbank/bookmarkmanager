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
 * Highlights matching text in a string by wrapping it with a mark element
 * @param text - The text to search in
 * @param query - The search query to highlight
 * @returns HTML string with highlighted matches
 */
export function highlightText(text: string, query: string): string {
	if (!query.trim()) {
		return text;
	}

	const escapedQuery = escapeRegex(query.trim());
	const regex = new RegExp(`(${escapedQuery})`, 'gi');

	return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
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
