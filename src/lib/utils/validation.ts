/**
 * Validate URL format
 * @param urlString - The URL string to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateUrl(urlString: string): { isValid: boolean; error?: string } {
	if (!urlString.trim()) {
		return { isValid: false, error: 'URL is required' };
	}

	try {
		const urlObj = new URL(urlString);
		// Only allow http and https protocols
		if (!['http:', 'https:'].includes(urlObj.protocol)) {
			return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
		}
		return { isValid: true };
	} catch {
		return { isValid: false, error: 'Invalid URL format' };
	}
}
