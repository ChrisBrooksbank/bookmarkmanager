import { describe, it, expect } from 'vitest';
import { validateUrl } from './validation';

describe('validateUrl', () => {
	it('should return error for empty string', () => {
		const result = validateUrl('');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('URL is required');
	});

	it('should return error for whitespace-only string', () => {
		const result = validateUrl('   ');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('URL is required');
	});

	it('should return error for invalid URL format', () => {
		const result = validateUrl('not-a-valid-url');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('Invalid URL format');
	});

	it('should return error for non-HTTP(S) protocols', () => {
		const result = validateUrl('ftp://example.com');
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('URL must use HTTP or HTTPS protocol');
	});

	it('should accept valid HTTP URL', () => {
		const result = validateUrl('http://example.com');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept valid HTTPS URL', () => {
		const result = validateUrl('https://example.com');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept URLs with paths', () => {
		const result = validateUrl('https://example.com/path/to/page');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept URLs with query parameters', () => {
		const result = validateUrl('https://example.com?foo=bar&baz=qux');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept URLs with fragments', () => {
		const result = validateUrl('https://example.com#section');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept complex URLs', () => {
		const result = validateUrl('https://user:pass@example.com:8080/path?query=value#fragment');
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});
});
