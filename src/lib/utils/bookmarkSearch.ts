import type { Bookmark, Folder, Tag } from '$lib/types';

export interface BookmarkSearchContext {
	tagsById: Map<string, Tag>;
	foldersById: Map<string, Folder>;
}

interface SearchToken {
	field: string | null;
	value: string;
	negated: boolean;
}

function tokenizeSearch(query: string): SearchToken[] {
	const tokens: SearchToken[] = [];
	const matches = query.matchAll(/(-?)([a-z]+:)?(?:"([^"]+)"|(\S+))/gi);

	for (const match of matches) {
		const field = match[2]?.slice(0, -1).toLowerCase() ?? null;
		const value = (match[3] ?? match[4] ?? '').trim().toLowerCase();
		if (!value) continue;
		tokens.push({
			field,
			value: field === null && value.startsWith('#') ? value.slice(1) : value,
			negated: match[1] === '-'
		});
	}

	return tokens;
}

function getFolderPath(
	folderId: string | null | undefined,
	foldersById: Map<string, Folder>
): string {
	const path: string[] = [];
	let currentId = folderId ?? null;
	const seen = new Set<string>();

	while (currentId && !seen.has(currentId)) {
		seen.add(currentId);
		const folder = foldersById.get(currentId);
		if (!folder) break;
		path.unshift(folder.name);
		currentId = folder.parentId ?? null;
	}

	return path.join('/');
}

function getDomain(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

function includes(value: string | undefined, query: string): boolean {
	return (value ?? '').toLowerCase().includes(query);
}

function tokenMatchesBookmark(
	bookmark: Bookmark,
	token: SearchToken,
	context: BookmarkSearchContext
): boolean {
	const tagNames = bookmark.tags
		.map((tagId) => context.tagsById.get(tagId)?.name)
		.filter(Boolean)
		.join(' ');
	const folderPath = getFolderPath(bookmark.folderId, context.foldersById);
	const domain = getDomain(bookmark.url);

	switch (token.field) {
		case 'title':
			return includes(bookmark.title, token.value);
		case 'url':
			return includes(bookmark.url, token.value);
		case 'domain':
			return includes(domain, token.value);
		case 'tag':
			return includes(tagNames, token.value);
		case 'folder':
			return includes(folderPath, token.value);
		case 'desc':
		case 'description':
			return includes(bookmark.description, token.value);
		case 'note':
		case 'notes':
			return includes(bookmark.notes, token.value);
		default:
			return [
				bookmark.title,
				bookmark.url,
				bookmark.description,
				bookmark.notes,
				tagNames,
				folderPath,
				domain
			].some((value) => includes(value, token.value));
	}
}

export function matchesBookmarkSearch(
	bookmark: Bookmark,
	query: string,
	context: BookmarkSearchContext
): boolean {
	const tokens = tokenizeSearch(query);
	if (tokens.length === 0) return true;

	return tokens.every((token) => {
		const matches = tokenMatchesBookmark(bookmark, token, context);
		return token.negated ? !matches : matches;
	});
}
