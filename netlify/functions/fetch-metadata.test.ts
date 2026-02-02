/**
 * Tests for the fetch-metadata Netlify Function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './fetch-metadata';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Mock fetch
global.fetch = vi.fn();

describe('fetch-metadata Netlify Function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockContext: HandlerContext = {
		callbackWaitsForEmptyEventLoop: true,
		functionName: 'fetch-metadata',
		functionVersion: '1',
		invokedFunctionArn: 'arn',
		memoryLimitInMB: '128',
		awsRequestId: 'request-id',
		logGroupName: 'log-group',
		logStreamName: 'log-stream',
		getRemainingTimeInMillis: () => 1000,
		done: () => {},
		fail: () => {},
		succeed: () => {}
	};

	describe('CORS handling', () => {
		it('should handle OPTIONS preflight request', async () => {
			const event: HandlerEvent = {
				httpMethod: 'OPTIONS',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: null,
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(200);
			expect(response?.headers).toMatchObject({
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
			});
		});
	});

	describe('Method validation', () => {
		it('should reject non-GET/POST methods', async () => {
			const event: HandlerEvent = {
				httpMethod: 'DELETE',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: null,
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(405);
			const body = JSON.parse(response?.body || '{}');
			expect(body.error).toBe('Method not allowed');
		});
	});

	describe('URL parameter validation', () => {
		it('should require URL parameter for GET request', async () => {
			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: null,
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(400);
			const body = JSON.parse(response?.body || '{}');
			expect(body.error).toBe('URL parameter is required');
		});

		it('should require URL parameter for POST request', async () => {
			const event: HandlerEvent = {
				httpMethod: 'POST',
				headers: {},
				body: JSON.stringify({}),
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: null,
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(400);
			const body = JSON.parse(response?.body || '{}');
			expect(body.error).toBe('URL parameter is required');
		});

		it('should validate URL format', async () => {
			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'not-a-valid-url' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(400);
			const body = JSON.parse(response?.body || '{}');
			expect(body.error).toBe('Invalid URL format');
		});
	});

	describe('Metadata extraction', () => {
		it('should fetch and extract metadata from HTML (GET request)', async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test Page</title>
						<meta name="description" content="Test description">
						<meta property="og:title" content="OG Title">
						<meta property="og:description" content="OG Description">
						<meta property="og:image" content="/og-image.png">
						<link rel="icon" href="/favicon.ico">
					</head>
					<body></body>
				</html>
			`;

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml
			});

			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'https://example.com' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(200);
			const body = JSON.parse(response?.body || '{}');
			expect(body.title).toBe('OG Title');
			expect(body.description).toBe('OG Description');
			expect(body.faviconUrl).toBe('https://example.com/favicon.ico');
			expect(body.ogImage).toBe('https://example.com/og-image.png');
		});

		it('should fetch and extract metadata from HTML (POST request)', async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test Page</title>
						<meta name="description" content="Test description">
					</head>
					<body></body>
				</html>
			`;

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml
			});

			const event: HandlerEvent = {
				httpMethod: 'POST',
				headers: {},
				body: JSON.stringify({ url: 'https://example.com' }),
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: null,
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(200);
			const body = JSON.parse(response?.body || '{}');
			expect(body.title).toBe('Test Page');
			expect(body.description).toBe('Test description');
		});

		it('should use hostname as fallback title when no title tag exists', async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<meta name="description" content="Test description">
					</head>
					<body></body>
				</html>
			`;

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml
			});

			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'https://example.com' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(200);
			const body = JSON.parse(response?.body || '{}');
			expect(body.title).toBe('example.com');
		});

		it('should handle fetch errors gracefully', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'https://example.com' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(500);
			const body = JSON.parse(response?.body || '{}');
			expect(body.error).toBe('Failed to fetch metadata');
			expect(body.message).toBe('Network error');
		});

		it('should handle HTTP errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'https://example.com/not-found' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(500);
			const body = JSON.parse(response?.body || '{}');
			expect(body.error).toBe('Failed to fetch metadata');
		});
	});

	describe('URL resolution', () => {
		it('should resolve relative favicon URLs to absolute', async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test Page</title>
						<link rel="icon" href="/assets/favicon.ico">
					</head>
					<body></body>
				</html>
			`;

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml
			});

			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'https://example.com/page' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(200);
			const body = JSON.parse(response?.body || '{}');
			expect(body.faviconUrl).toBe('https://example.com/assets/favicon.ico');
		});

		it('should resolve relative OG image URLs to absolute', async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test Page</title>
						<meta property="og:image" content="/images/og-image.png">
					</head>
					<body></body>
				</html>
			`;

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml
			});

			const event: HandlerEvent = {
				httpMethod: 'GET',
				headers: {},
				body: null,
				isBase64Encoded: false,
				rawUrl: '',
				rawQuery: '',
				path: '',
				queryStringParameters: { url: 'https://example.com' },
				multiValueQueryStringParameters: null
			};

			const response = await handler(event, mockContext, () => {});

			expect(response?.statusCode).toBe(200);
			const body = JSON.parse(response?.body || '{}');
			expect(body.ogImage).toBe('https://example.com/images/og-image.png');
		});
	});
});
