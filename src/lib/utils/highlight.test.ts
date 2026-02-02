import { describe, it, expect } from 'vitest';
import { highlightText, containsQuery } from './highlight';

describe('highlightText', () => {
	it('should highlight matching text with mark element', () => {
		const result = highlightText('Hello World', 'World');
		expect(result).toBe('Hello <mark class="bg-yellow-200 dark:bg-yellow-600">World</mark>');
	});

	it('should be case-insensitive', () => {
		const result = highlightText('Hello World', 'world');
		expect(result).toBe('Hello <mark class="bg-yellow-200 dark:bg-yellow-600">World</mark>');
	});

	it('should highlight multiple matches', () => {
		const result = highlightText('test test test', 'test');
		expect(result).toBe(
			'<mark class="bg-yellow-200 dark:bg-yellow-600">test</mark> <mark class="bg-yellow-200 dark:bg-yellow-600">test</mark> <mark class="bg-yellow-200 dark:bg-yellow-600">test</mark>'
		);
	});

	it('should return original text when query is empty', () => {
		const result = highlightText('Hello World', '');
		expect(result).toBe('Hello World');
	});

	it('should return original text when query is whitespace only', () => {
		const result = highlightText('Hello World', '   ');
		expect(result).toBe('Hello World');
	});

	it('should escape special regex characters', () => {
		const result = highlightText('Price: $100', '$100');
		expect(result).toBe('Price: <mark class="bg-yellow-200 dark:bg-yellow-600">$100</mark>');
	});

	it('should handle partial word matches', () => {
		const result = highlightText('JavaScript', 'Script');
		expect(result).toBe('Java<mark class="bg-yellow-200 dark:bg-yellow-600">Script</mark>');
	});

	it('should handle URL highlighting', () => {
		const result = highlightText('https://example.com/path', 'example');
		expect(result).toBe(
			'https://<mark class="bg-yellow-200 dark:bg-yellow-600">example</mark>.com/path'
		);
	});

	it('should handle text with special characters', () => {
		const result = highlightText('React (v18.2)', 'v18');
		expect(result).toBe('React (<mark class="bg-yellow-200 dark:bg-yellow-600">v18</mark>.2)');
	});

	it('should preserve text when no match found', () => {
		const result = highlightText('Hello World', 'xyz');
		expect(result).toBe('Hello World');
	});
});

describe('containsQuery', () => {
	it('should return true when text contains query', () => {
		expect(containsQuery('Hello World', 'World')).toBe(true);
	});

	it('should be case-insensitive', () => {
		expect(containsQuery('Hello World', 'world')).toBe(true);
	});

	it('should return false when text does not contain query', () => {
		expect(containsQuery('Hello World', 'xyz')).toBe(false);
	});

	it('should return false when text is undefined', () => {
		expect(containsQuery(undefined, 'test')).toBe(false);
	});

	it('should return false when query is empty', () => {
		expect(containsQuery('Hello World', '')).toBe(false);
	});

	it('should return false when query is whitespace only', () => {
		expect(containsQuery('Hello World', '   ')).toBe(false);
	});

	it('should handle partial matches', () => {
		expect(containsQuery('JavaScript', 'Script')).toBe(true);
	});
});
