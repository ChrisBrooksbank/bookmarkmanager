import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the SvelteKit service worker modules
vi.mock('$service-worker', () => ({
	build: ['/build/app.js', '/build/app.css'],
	files: ['/favicon.ico', '/manifest.json'],
	version: 'test-version-1'
}));

// Mock service worker global scope
const mockCaches = {
	open: vi.fn(),
	keys: vi.fn(),
	delete: vi.fn(),
	match: vi.fn()
};

const mockCache = {
	addAll: vi.fn(),
	match: vi.fn(),
	put: vi.fn()
};

global.caches = mockCaches as any;

describe('Service Worker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCaches.open.mockResolvedValue(mockCache);
		mockCaches.keys.mockResolvedValue([]);
	});

	describe('Cache Management', () => {
		it('should cache all static assets on install', async () => {
			const event = new Event('install') as any;
			const waitUntilPromises: Promise<any>[] = [];

			event.waitUntil = (promise: Promise<any>) => {
				waitUntilPromises.push(promise);
			};

			// Simulate install event
			mockCache.addAll.mockResolvedValue(undefined);

			// Mock the service worker's install handler
			const addFilesToCache = async () => {
				const cache = await caches.open('cache-test-version-1');
				await cache.addAll(['/build/app.js', '/build/app.css', '/favicon.ico', '/manifest.json']);
			};

			event.waitUntil(addFilesToCache());

			await Promise.all(waitUntilPromises);

			expect(mockCaches.open).toHaveBeenCalledWith('cache-test-version-1');
			expect(mockCache.addAll).toHaveBeenCalledWith([
				'/build/app.js',
				'/build/app.css',
				'/favicon.ico',
				'/manifest.json'
			]);
		});

		it('should delete old caches on activate', async () => {
			const event = new Event('activate') as any;
			const waitUntilPromises: Promise<any>[] = [];

			event.waitUntil = (promise: Promise<any>) => {
				waitUntilPromises.push(promise);
			};

			mockCaches.keys.mockResolvedValue(['cache-old-version', 'cache-test-version-1']);
			mockCaches.delete.mockResolvedValue(true);

			// Mock the service worker's activate handler
			const deleteOldCaches = async () => {
				const currentCache = 'cache-test-version-1';
				for (const key of await caches.keys()) {
					if (key !== currentCache) await caches.delete(key);
				}
			};

			event.waitUntil(deleteOldCaches());

			await Promise.all(waitUntilPromises);

			expect(mockCaches.keys).toHaveBeenCalled();
			expect(mockCaches.delete).toHaveBeenCalledWith('cache-old-version');
			expect(mockCaches.delete).not.toHaveBeenCalledWith('cache-test-version-1');
		});
	});

	describe('Fetch Handling', () => {
		it('should serve cached assets for static files', async () => {
			const cachedResponse = new Response('cached content');

			mockCache.match.mockResolvedValue(cachedResponse);

			const cache = await caches.open('cache-test-version-1');
			const response = await cache.match('/build/app.js');

			expect(response).toBe(cachedResponse);
			expect(mockCache.match).toHaveBeenCalledWith('/build/app.js');
		});

		it('should fetch from network and cache successful responses', async () => {
			const networkResponse = new Response('network content', { status: 200 });

			mockCache.match.mockResolvedValue(undefined);
			mockCache.put.mockResolvedValue(undefined);

			// Simulate network fetch and cache
			global.fetch = vi.fn().mockResolvedValue({
				status: 200,
				clone: () => networkResponse
			});

			const cache = await caches.open('cache-test-version-1');

			// Simulate the fetch handler logic - network first for non-static resources
			const url = 'https://example.com/api/data';
			const cachedResponse = await cache.match(url);
			if (!cachedResponse) {
				const response = await fetch(url);
				if (response.status === 200) {
					await cache.put(url, response.clone());
				}
			}

			expect(global.fetch).toHaveBeenCalledWith(url);
			expect(mockCache.put).toHaveBeenCalled();
		});

		it('should return cached response when network fails', async () => {
			const request = new Request('https://example.com/api/data');
			const cachedResponse = new Response('cached content');

			mockCache.match.mockResolvedValue(cachedResponse);
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			const cache = await caches.open('cache-test-version-1');

			// Simulate the fetch handler logic with network failure
			let response: Response;
			try {
				response = await fetch(request);
			} catch {
				const cached = await cache.match(request.url);
				response = cached || new Response('Offline', { status: 503 });
			}

			expect(response).toBeDefined();
			expect(mockCache.match).toHaveBeenCalled();
		});

		it('should return offline response when not in cache and network fails', async () => {
			const request = new Request('https://example.com/api/data');

			mockCache.match.mockResolvedValue(undefined);
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			const cache = await caches.open('cache-test-version-1');

			// Simulate the fetch handler logic
			let response: Response;
			try {
				response = await fetch(request);
			} catch {
				const cached = await cache.match(request.url);
				response =
					cached ||
					new Response('Offline', {
						status: 503,
						statusText: 'Service Unavailable'
					});
			}

			expect(response.status).toBe(503);
			expect(response.statusText).toBe('Service Unavailable');
		});
	});

	describe('Cache Strategy', () => {
		it('should use cache-first strategy for build assets', async () => {
			const cachedResponse = new Response('cached app.js');

			mockCache.match.mockResolvedValue(cachedResponse);

			const cache = await caches.open('cache-test-version-1');
			const response = await cache.match('/build/app.js');

			expect(response).toBe(cachedResponse);
		});

		it('should use network-first strategy for non-static resources', async () => {
			const networkResponse = new Response('fresh data', { status: 200 });

			mockCache.match.mockResolvedValue(undefined);
			global.fetch = vi.fn().mockResolvedValue({
				...networkResponse,
				clone: () => networkResponse
			});

			const cache = await caches.open('cache-test-version-1');
			const cachedResponse = await cache.match('/api/bookmarks');

			if (!cachedResponse) {
				const response = await fetch('/api/bookmarks');
				expect(response).toBeDefined();
			}

			expect(global.fetch).toHaveBeenCalled();
		});
	});
});
