/**
 * Core data types for the bookmark manager
 */

/**
 * Tag applied to a bookmark for flexible categorization
 */
export interface Tag {
	/** Unique identifier for the tag */
	id: string;
	/** Display name of the tag */
	name: string;
	/** Optional hex color code for visual distinction (e.g., #FF5733) */
	color?: string;
}

/**
 * Folder for organizing bookmarks in a hierarchical structure
 */
export interface Folder {
	/** Unique identifier for the folder */
	id: string;
	/** Display name of the folder */
	name: string;
	/** Parent folder ID for nested folders, null/undefined for root folders */
	parentId?: string | null;
	/** Timestamp when the folder was created */
	createdAt: number;
}

/**
 * Bookmark representing a saved URL with metadata
 */
export interface Bookmark {
	/** Unique identifier for the bookmark */
	id: string;
	/** The URL being bookmarked */
	url: string;
	/** Display title (auto-fetched from page or user-provided) */
	title: string;
	/** Optional description or notes about the bookmark */
	description?: string;
	/** Optional personal notes/annotations for research context */
	notes?: string;
	/** Optional folder ID this bookmark belongs to */
	folderId?: string | null;
	/** Array of tag IDs associated with this bookmark */
	tags: string[];
	/** Timestamp when the bookmark was created */
	createdAt: number;
	/** Timestamp when the bookmark was last modified */
	updatedAt: number;
	/** Optional URL to the page's favicon */
	faviconUrl?: string;
	/** Optional Open Graph image URL for visual preview */
	ogImage?: string;
}
