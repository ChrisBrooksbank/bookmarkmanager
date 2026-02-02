/**
 * Netlify Function for fetching page metadata
 * This serverless function acts as a proxy to fetch metadata from URLs
 * without being blocked by CORS restrictions.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface PageMetadata {
	title: string;
	description?: string;
	faviconUrl?: string;
	ogImage?: string;
}

/**
 * Extracts the favicon URL from a given URL
 */
function getFaviconUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		return `${urlObj.origin}/favicon.ico`;
	} catch {
		return '';
	}
}

/**
 * Resolves a potentially relative URL to an absolute URL
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
	try {
		return new URL(relativeUrl, baseUrl).href;
	} catch {
		return relativeUrl;
	}
}

/**
 * Extracts metadata from HTML content
 */
function extractMetadataFromHtml(html: string, url: string): PageMetadata {
	// Use regex-based parsing since DOMParser is not available in serverless functions
	const metaTags: Record<string, string> = {};

	// Extract meta tags
	const metaRegex = /<meta\s+([^>]*)>/gi;
	let match;
	while ((match = metaRegex.exec(html)) !== null) {
		const attrs = match[1];

		// Extract property/name and content attributes
		const propertyMatch = attrs.match(/(?:property|name)=["']([^"']+)["']/i);
		const contentMatch = attrs.match(/content=["']([^"']+)["']/i);

		if (propertyMatch && contentMatch) {
			metaTags[propertyMatch[1].toLowerCase()] = contentMatch[1];
		}
	}

	// Extract title from <title> tag
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	const titleTag = titleMatch ? titleMatch[1].trim() : '';

	// Extract title (prioritize Open Graph, then Twitter, then standard title tag)
	const title =
		metaTags['og:title'] || metaTags['twitter:title'] || titleTag || new URL(url).hostname;

	// Extract description (prioritize Open Graph, then meta description, then Twitter)
	const description =
		metaTags['og:description'] || metaTags['description'] || metaTags['twitter:description'];

	// Extract Open Graph image
	const ogImage = metaTags['og:image'] || metaTags['twitter:image'];

	// Extract favicon URL from link tags
	const linkRegex = /<link\s+([^>]*)>/gi;
	let faviconUrl = '';

	while ((match = linkRegex.exec(html)) !== null) {
		const attrs = match[1];

		// Check if this is an icon link
		const relMatch = attrs.match(/rel=["']([^"']+)["']/i);
		const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);

		if (relMatch && hrefMatch) {
			const rel = relMatch[1].toLowerCase();
			if (
				rel.includes('icon') ||
				rel.includes('shortcut icon') ||
				rel.includes('apple-touch-icon')
			) {
				faviconUrl = hrefMatch[1];
				break;
			}
		}
	}

	// Convert relative URLs to absolute
	const resolvedFaviconUrl = faviconUrl ? resolveUrl(faviconUrl, url) : getFaviconUrl(url);
	const resolvedOgImage = ogImage ? resolveUrl(ogImage, url) : undefined;

	return {
		title: title.trim(),
		description: description?.trim(),
		faviconUrl: resolvedFaviconUrl,
		ogImage: resolvedOgImage
	};
}

/**
 * Netlify Function handler
 */
export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
	// Set CORS headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Content-Type': 'application/json'
	};

	// Handle OPTIONS request for CORS preflight
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers,
			body: ''
		};
	}

	// Only allow GET and POST methods
	if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
		return {
			statusCode: 405,
			headers,
			body: JSON.stringify({ error: 'Method not allowed' })
		};
	}

	try {
		// Get URL from query string (GET) or body (POST)
		let url: string | null = null;

		if (event.httpMethod === 'GET') {
			url = event.queryStringParameters?.url || null;
		} else if (event.httpMethod === 'POST' && event.body) {
			const body = JSON.parse(event.body);
			url = body.url || null;
		}

		// Validate URL parameter
		if (!url) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ error: 'URL parameter is required' })
			};
		}

		// Validate URL format
		try {
			new URL(url);
		} catch {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ error: 'Invalid URL format' })
			};
		}

		// Fetch the page
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'BookmarkVault-MetadataFetcher/1.0'
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const html = await response.text();

		// Extract metadata
		const metadata = extractMetadataFromHtml(html, url);

		// Return metadata
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(metadata)
		};
	} catch (error) {
		console.error('Error fetching metadata:', error);

		// Return error response
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				error: 'Failed to fetch metadata',
				message: error instanceof Error ? error.message : 'Unknown error'
			})
		};
	}
};
