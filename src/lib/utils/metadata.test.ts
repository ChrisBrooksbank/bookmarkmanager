import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFaviconUrl, extractMetadataFromHtml, fetchPageMetadata } from './metadata';

describe('getFaviconUrl', () => {
	it('should return favicon.ico path for valid URL', () => {
		const result = getFaviconUrl('https://example.com/page');
		expect(result).toBe('https://example.com/favicon.ico');
	});

	it('should handle URLs with paths', () => {
		const result = getFaviconUrl('https://example.com/path/to/page');
		expect(result).toBe('https://example.com/favicon.ico');
	});

	it('should handle URLs with query parameters', () => {
		const result = getFaviconUrl('https://example.com/page?foo=bar');
		expect(result).toBe('https://example.com/favicon.ico');
	});

	it('should handle URLs with ports', () => {
		const result = getFaviconUrl('https://example.com:8080/page');
		expect(result).toBe('https://example.com:8080/favicon.ico');
	});

	it('should return empty string for invalid URL', () => {
		const result = getFaviconUrl('not-a-url');
		expect(result).toBe('');
	});
});

describe('extractMetadataFromHtml', () => {
	it('should extract title from title tag', () => {
		const html = '<html><head><title>Test Page</title></head></html>';
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.title).toBe('Test Page');
	});

	it('should prioritize Open Graph title over standard title', () => {
		const html = `
			<html>
				<head>
					<title>Standard Title</title>
					<meta property="og:title" content="OG Title" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.title).toBe('OG Title');
	});

	it('should prioritize Twitter title if OG title missing', () => {
		const html = `
			<html>
				<head>
					<title>Standard Title</title>
					<meta name="twitter:title" content="Twitter Title" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.title).toBe('Twitter Title');
	});

	it('should fallback to hostname if no title found', () => {
		const html = '<html><head></head></html>';
		const result = extractMetadataFromHtml(html, 'https://example.com/page');
		expect(result.title).toBe('example.com');
	});

	it('should extract description from meta tag', () => {
		const html = `
			<html>
				<head>
					<meta name="description" content="Test Description" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.description).toBe('Test Description');
	});

	it('should prioritize Open Graph description', () => {
		const html = `
			<html>
				<head>
					<meta name="description" content="Standard Description" />
					<meta property="og:description" content="OG Description" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.description).toBe('OG Description');
	});

	it('should return undefined for missing description', () => {
		const html = '<html><head></head></html>';
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.description).toBeUndefined();
	});

	it('should extract favicon from link tag', () => {
		const html = `
			<html>
				<head>
					<link rel="icon" href="/favicon.png" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.faviconUrl).toBe('https://example.com/favicon.png');
	});

	it('should handle absolute favicon URLs', () => {
		const html = `
			<html>
				<head>
					<link rel="icon" href="https://cdn.example.com/icon.png" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.faviconUrl).toBe('https://cdn.example.com/icon.png');
	});

	it('should prioritize shortcut icon', () => {
		const html = `
			<html>
				<head>
					<link rel="shortcut icon" href="/shortcut.ico" />
					<link rel="icon" href="/icon.png" />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.faviconUrl).toBe('https://example.com/shortcut.ico');
	});

	it('should fallback to /favicon.ico if no link tag found', () => {
		const html = '<html><head></head></html>';
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
	});

	it('should trim whitespace from title and description', () => {
		const html = `
			<html>
				<head>
					<title>  Test Page  </title>
					<meta name="description" content="  Test Description  " />
				</head>
			</html>
		`;
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.title).toBe('Test Page');
		expect(result.description).toBe('Test Description');
	});

	it('should handle malformed HTML gracefully', () => {
		const html = '<html><head><title>Test</title>';
		const result = extractMetadataFromHtml(html, 'https://example.com');
		expect(result.title).toBe('Test');
	});
});

describe('fetchPageMetadata', () => {
	beforeEach(() => {
		// Mock console.warn to avoid cluttering test output
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return metadata when fetch succeeds', async () => {
		const mockHtml = `
			<html>
				<head>
					<title>Test Page</title>
					<meta name="description" content="Test Description" />
					<link rel="icon" href="/favicon.png" />
				</head>
			</html>
		`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockHtml)
		});

		const result = await fetchPageMetadata('https://example.com');

		expect(result.title).toBe('Test Page');
		expect(result.description).toBe('Test Description');
		expect(result.faviconUrl).toBe('https://example.com/favicon.png');
	});

	it('should return fallback metadata when fetch fails', async () => {
		global.fetch = vi.fn().mockRejectedValue(new Error('CORS error'));

		const result = await fetchPageMetadata('https://example.com');

		expect(result.title).toBe('example.com');
		expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
	});

	it('should return fallback metadata when HTTP status is not OK', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404
		});

		const result = await fetchPageMetadata('https://example.com');

		expect(result.title).toBe('example.com');
		expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
	});

	it('should handle invalid URL', async () => {
		await expect(fetchPageMetadata('not-a-url')).rejects.toThrow();
	});

	it('should apply 5 second timeout', async () => {
		global.fetch = vi.fn().mockImplementation((_url, options) => {
			expect(options?.signal).toBeDefined();
			return Promise.reject(new Error('Timeout'));
		});

		const result = await fetchPageMetadata('https://example.com');

		expect(result.title).toBe('example.com');
	});

	it('should log warning when fetch fails', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn');
		global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		await fetchPageMetadata('https://example.com');

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'Failed to fetch metadata for https://example.com:',
			expect.any(Error)
		);
	});
});
