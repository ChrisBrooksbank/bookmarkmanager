import { describe, it, expect } from 'vitest';
import {
	getDuplicateGroups,
	normalizeUrlForComparison,
	removeTrackingParams
} from './bookmarkAudit';
import type { Bookmark } from '$lib/types';

function bookmark(id: string, url: string, title = 'Some bookmark title'): Bookmark {
	return { id, url, title, tags: [], createdAt: 1, updatedAt: 1 };
}

describe('removeTrackingParams', () => {
	it('strips tracking parameters and keeps the rest of the query', () => {
		expect(removeTrackingParams('https://example.com/a?utm_source=x&id=7&fbclid=y')).toBe(
			'https://example.com/a?id=7'
		);
	});

	it('leaves URLs without tracking parameters untouched', () => {
		const urls = [
			'http://www.example.com/',
			'https://example.com/app#/route',
			'https://example.com/path/'
		];
		for (const url of urls) {
			expect(removeTrackingParams(url)).toBe(url);
		}
	});

	it('preserves protocol, www and fragments when cleaning', () => {
		expect(removeTrackingParams('http://www.example.com/page?utm_medium=email#section')).toBe(
			'http://www.example.com/page#section'
		);
	});

	it('returns invalid URLs unchanged', () => {
		expect(removeTrackingParams('not a url')).toBe('not a url');
	});
});

describe('normalizeUrlForComparison', () => {
	it('treats http/https, www and trailing slashes as equivalent', () => {
		expect(normalizeUrlForComparison('http://www.example.com/page/')).toBe(
			normalizeUrlForComparison('https://example.com/page')
		);
	});
});

describe('getDuplicateGroups', () => {
	it('groups bookmarks that only differ by tracking params', () => {
		const groups = getDuplicateGroups([
			bookmark('a', 'https://example.com/post?utm_source=feed'),
			bookmark('b', 'https://www.example.com/post'),
			bookmark('c', 'https://other.com/', 'Different')
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0].bookmarks.map((b) => b.id).sort()).toEqual(['a', 'b']);
	});
});
