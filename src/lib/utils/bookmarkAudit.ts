import type { Bookmark, Tag } from '$lib/types';

export type LinkHealthStatus = 'unchecked' | 'ok' | 'redirected' | 'broken' | 'timeout' | 'unknown';

export interface LinkHealthResult {
	bookmarkId: string;
	status: LinkHealthStatus;
	statusCode?: number;
	finalUrl?: string;
	message?: string;
	checkedAt: number;
}

export interface DuplicateGroup {
	key: string;
	reason: string;
	bookmarks: Bookmark[];
}

export interface DomainCluster {
	domain: string;
	bookmarks: Bookmark[];
}

export interface SuggestedTagGroup {
	tagName: string;
	bookmarkIds: string[];
	reason: string;
}

export interface StaleCandidate {
	bookmark: Bookmark;
	reasons: string[];
	score: number;
}

const TRACKING_PARAMS = new Set([
	'fbclid',
	'gclid',
	'igshid',
	'mc_cid',
	'mc_eid',
	'ref',
	'si',
	'utm_campaign',
	'utm_content',
	'utm_medium',
	'utm_source',
	'utm_term'
]);

const DOMAIN_TAG_RULES: Array<{ tagName: string; test: (url: URL) => boolean; reason: string }> = [
	{
		tagName: 'code',
		test: (url) => /(^|\.)github\.com$/.test(url.hostname),
		reason: 'GitHub links'
	},
	{
		tagName: 'video',
		test: (url) => /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)vimeo\.com$/.test(url.hostname),
		reason: 'Video links'
	},
	{
		tagName: 'docs',
		test: (url) =>
			url.hostname.startsWith('docs.') ||
			url.pathname.toLowerCase().includes('/docs') ||
			url.hostname.includes('developer.'),
		reason: 'Documentation-shaped URLs'
	},
	{
		tagName: 'reading',
		test: (url) =>
			/(^|\.)medium\.com$|(^|\.)substack\.com$|(^|\.)dev\.to$/.test(url.hostname) ||
			url.pathname.toLowerCase().includes('/blog'),
		reason: 'Article and blog links'
	},
	{
		tagName: 'reference',
		test: (url) =>
			/wikipedia\.org$|stackoverflow\.com$|developer\.mozilla\.org$/.test(url.hostname),
		reason: 'Reference sites'
	}
];

function parseUrl(url: string): URL | null {
	try {
		return new URL(url);
	} catch {
		return null;
	}
}

export function getDomain(url: string): string {
	const parsed = parseUrl(url);
	return parsed?.hostname.replace(/^www\./, '').toLowerCase() ?? 'invalid-url';
}

export function normalizeUrlForComparison(url: string): string {
	const parsed = parseUrl(url);
	if (!parsed) return url.trim().toLowerCase();

	parsed.hash = '';
	for (const key of Array.from(parsed.searchParams.keys())) {
		if (TRACKING_PARAMS.has(key.toLowerCase())) {
			parsed.searchParams.delete(key);
		}
	}

	parsed.hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
	parsed.pathname = parsed.pathname.replace(/\/$/, '');
	if (parsed.protocol === 'http:') parsed.protocol = 'https:';

	return parsed.href.replace(/\/$/, '');
}

function normalizeTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function getDuplicateGroups(bookmarks: Bookmark[]): DuplicateGroup[] {
	const exactGroups = new Map<string, Bookmark[]>();
	const titleDomainGroups = new Map<string, Bookmark[]>();

	for (const bookmark of bookmarks) {
		const normalizedUrl = normalizeUrlForComparison(bookmark.url);
		exactGroups.set(normalizedUrl, [...(exactGroups.get(normalizedUrl) ?? []), bookmark]);

		const titleKey = normalizeTitle(bookmark.title);
		if (titleKey.length >= 8) {
			const nearKey = `${getDomain(bookmark.url)}::${titleKey}`;
			titleDomainGroups.set(nearKey, [...(titleDomainGroups.get(nearKey) ?? []), bookmark]);
		}
	}

	const groups: DuplicateGroup[] = [];
	const seenBookmarkSets = new Set<string>();

	for (const [key, group] of exactGroups) {
		if (group.length < 2) continue;
		const signature = group
			.map((bookmark) => bookmark.id)
			.sort()
			.join('|');
		seenBookmarkSets.add(signature);
		groups.push({ key, reason: 'Same URL after cleaning tracking parameters', bookmarks: group });
	}

	for (const [key, group] of titleDomainGroups) {
		if (group.length < 2) continue;
		const signature = group
			.map((bookmark) => bookmark.id)
			.sort()
			.join('|');
		if (seenBookmarkSets.has(signature)) continue;
		groups.push({ key, reason: 'Same domain and very similar title', bookmarks: group });
	}

	return groups.sort((a, b) => b.bookmarks.length - a.bookmarks.length);
}

export function getDomainClusters(bookmarks: Bookmark[]): DomainCluster[] {
	const byDomain = new Map<string, Bookmark[]>();
	for (const bookmark of bookmarks) {
		const domain = getDomain(bookmark.url);
		byDomain.set(domain, [...(byDomain.get(domain) ?? []), bookmark]);
	}

	return Array.from(byDomain, ([domain, domainBookmarks]) => ({
		domain,
		bookmarks: domainBookmarks
	})).sort((a, b) => b.bookmarks.length - a.bookmarks.length || a.domain.localeCompare(b.domain));
}

export function getSuggestedTagGroups(bookmarks: Bookmark[], tags: Tag[]): SuggestedTagGroup[] {
	const existingNames = new Set(tags.map((tag) => tag.name.toLowerCase()));
	const suggestions = new Map<string, SuggestedTagGroup>();

	for (const bookmark of bookmarks) {
		const parsed = parseUrl(bookmark.url);
		if (!parsed) continue;
		const bookmarkTagIds = new Set(bookmark.tags);

		for (const rule of DOMAIN_TAG_RULES) {
			if (!rule.test(parsed)) continue;
			const existingTag = tags.find((tag) => tag.name.toLowerCase() === rule.tagName);
			if (existingTag && bookmarkTagIds.has(existingTag.id)) continue;

			const suggestion = suggestions.get(rule.tagName) ?? {
				tagName: rule.tagName,
				bookmarkIds: [],
				reason: rule.reason
			};
			suggestion.bookmarkIds.push(bookmark.id);
			suggestions.set(rule.tagName, suggestion);
		}
	}

	return Array.from(suggestions.values())
		.filter(
			(suggestion) => suggestion.bookmarkIds.length > 0 || !existingNames.has(suggestion.tagName)
		)
		.sort((a, b) => b.bookmarkIds.length - a.bookmarkIds.length);
}

export function getStaleCandidates(
	bookmarks: Bookmark[],
	healthByBookmarkId: Map<string, LinkHealthResult>
): StaleCandidate[] {
	const now = Date.now();
	const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;

	return bookmarks
		.map((bookmark) => {
			const reasons: string[] = [];
			let score = 0;
			const health = healthByBookmarkId.get(bookmark.id);
			const domain = getDomain(bookmark.url);

			if (health?.status === 'broken') {
				reasons.push('link check failed');
				score += 5;
			}
			if (health?.status === 'timeout') {
				reasons.push('timed out');
				score += 3;
			}
			if (!bookmark.description && !bookmark.notes) {
				reasons.push('no notes or description');
				score += 1;
			}
			if (!bookmark.faviconUrl && !bookmark.ogImage) {
				reasons.push('no saved visual metadata');
				score += 1;
			}
			if (now - bookmark.createdAt > twoYears && bookmark.updatedAt === bookmark.createdAt) {
				reasons.push('old and never edited');
				score += 2;
			}
			if (
				domain.includes('google.') ||
				domain.includes('bing.') ||
				bookmark.url.includes('/search?') ||
				bookmark.url.includes('utm_')
			) {
				reasons.push('looks like a search or tracking URL');
				score += 2;
			}

			return { bookmark, reasons, score };
		})
		.filter((candidate) => candidate.score > 0)
		.sort((a, b) => b.score - a.score);
}

export async function checkBookmarkHealth(bookmark: Bookmark): Promise<LinkHealthResult> {
	const checkedAt = Date.now();

	try {
		const response = await fetch(
			`/api/check-link?bookmarkId=${encodeURIComponent(bookmark.id)}&url=${encodeURIComponent(bookmark.url)}`,
			{ signal: AbortSignal.timeout(12000) }
		);
		const result = (await response.json()) as LinkHealthResult;
		if (result.bookmarkId && result.status) {
			return result;
		}

		return {
			bookmarkId: bookmark.id,
			status: response.ok ? 'ok' : 'broken',
			statusCode: response.status,
			message: response.statusText,
			checkedAt
		};
	} catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError') {
			return { bookmarkId: bookmark.id, status: 'timeout', message: 'Timed out', checkedAt };
		}

		return {
			bookmarkId: bookmark.id,
			status: 'unknown',
			message: error instanceof Error ? error.message : 'Could not check link',
			checkedAt
		};
	}
}
