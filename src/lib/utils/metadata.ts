/**
 * Metadata fetching utilities for bookmarks
 */

export interface PageMetadata {
	title: string;
	description?: string;
	faviconUrl?: string;
	ogImage?: string;
}

/**
 * Extracts the favicon URL from a given URL
 * @param url - The URL to extract favicon from
 * @returns The favicon URL (standard /favicon.ico path)
 */
export function getFaviconUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		return `${urlObj.origin}/favicon.ico`;
	} catch {
		return '';
	}
}

/**
 * Fetches page metadata via Netlify Function (production) or direct fetch (development)
 * Uses a serverless function as a proxy to avoid CORS restrictions.
 *
 * @param url - The URL to fetch metadata from
 * @param useNetlifyFunction - Whether to use Netlify Function proxy (default: auto-detect)
 * @returns Promise resolving to page metadata
 */
export async function fetchPageMetadata(
	url: string,
	useNetlifyFunction: boolean = isProductionEnvironment()
): Promise<PageMetadata> {
	try {
		// Validate URL first
		new URL(url);

		if (useNetlifyFunction) {
			// Use Netlify Function for production to avoid CORS issues
			return await fetchViaNetlifyFunction(url);
		} else {
			// Direct fetch for development (will fail for most sites due to CORS)
			return await fetchDirectly(url);
		}
	} catch (error) {
		// If fetch fails (likely due to CORS), return basic metadata
		console.warn(`Failed to fetch metadata for ${url}:`, error);

		// Return fallback metadata using URL components
		const urlObj = new URL(url);
		return {
			title: urlObj.hostname,
			faviconUrl: getFaviconUrl(url)
		};
	}
}

/**
 * Determines if running in production environment
 * @returns true if in production, false otherwise
 */
function isProductionEnvironment(): boolean {
	// Check if running in browser
	if (typeof window !== 'undefined') {
		// In production on Netlify, the URL will be on the production domain
		return (
			window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
		);
	}
	// For SSR or build time, default to false
	return false;
}

/**
 * Fetches metadata via Netlify Function
 * @param url - The URL to fetch metadata from
 * @returns Promise resolving to page metadata
 */
async function fetchViaNetlifyFunction(url: string): Promise<PageMetadata> {
	const functionUrl = `/.netlify/functions/fetch-metadata?url=${encodeURIComponent(url)}`;

	const response = await fetch(functionUrl, {
		method: 'GET',
		signal: AbortSignal.timeout(15000) // 15 second timeout (function has 10s timeout + buffer)
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const metadata = await response.json();
	return metadata;
}

/**
 * Fetches metadata directly from URL (development only)
 * Note: This will fail for most external sites due to CORS restrictions
 * @param url - The URL to fetch metadata from
 * @returns Promise resolving to page metadata
 */
async function fetchDirectly(url: string): Promise<PageMetadata> {
	// Attempt to fetch the page with CORS mode
	// Note: This will fail for most external sites due to CORS restrictions
	const response = await fetch(url, {
		method: 'GET',
		mode: 'cors',
		signal: AbortSignal.timeout(5000) // 5 second timeout
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const html = await response.text();

	// Extract metadata from HTML
	const metadata = extractMetadataFromHtml(html, url);

	return metadata;
}

/**
 * Extracts metadata from HTML content
 * @param html - The HTML content to parse
 * @param url - The original URL (for favicon fallback)
 * @returns Extracted page metadata
 */
export function extractMetadataFromHtml(html: string, url: string): PageMetadata {
	// Parse HTML using DOMParser (available in browser)
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	// Extract title (prioritize Open Graph, then Twitter, then standard title tag)
	let title =
		doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
		doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
		doc.querySelector('title')?.textContent ||
		new URL(url).hostname;

	// Clean up title (remove extra whitespace)
	title = title.trim();

	// Extract description (prioritize Open Graph, then meta description, then Twitter)
	const description =
		doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
		doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
		doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
		undefined;

	// Extract Open Graph image (prioritize og:image, then twitter:image)
	const ogImage =
		doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
		doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
		undefined;

	// Extract favicon URL
	// Priority: icon with type="image/x-icon", shortcut icon, icon, apple-touch-icon
	const linkIcon =
		doc.querySelector('link[rel~="icon"][type="image/x-icon"]')?.getAttribute('href') ||
		doc.querySelector('link[rel~="shortcut icon"]')?.getAttribute('href') ||
		doc.querySelector('link[rel~="icon"]')?.getAttribute('href') ||
		doc.querySelector('link[rel~="apple-touch-icon"]')?.getAttribute('href');

	// Convert relative URLs to absolute
	const faviconUrl = linkIcon ? resolveUrl(linkIcon, url) : getFaviconUrl(url);
	const resolvedOgImage = ogImage ? resolveUrl(ogImage, url) : undefined;

	return {
		title,
		description: description?.trim() || undefined,
		faviconUrl,
		ogImage: resolvedOgImage
	};
}

/**
 * Resolves a potentially relative URL to an absolute URL
 * @param relativeUrl - The URL to resolve (may be relative or absolute)
 * @param baseUrl - The base URL to resolve against
 * @returns The resolved absolute URL
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
	try {
		return new URL(relativeUrl, baseUrl).href;
	} catch {
		return relativeUrl;
	}
}
