/**
 * UI state store for view preferences, filters, and search
 * Uses Svelte 5 runes for reactive state management
 * Persists preferences to localStorage
 */

const STORAGE_KEY = 'ui-state';

/**
 * View mode options for displaying bookmarks
 */
export type ViewMode = 'grid' | 'list' | 'compact';

/**
 * Sort options for bookmarks
 */
export type SortBy = 'newest' | 'oldest' | 'alphabetical' | 'recently-updated';

/**
 * Date range filter options
 */
export type DateRange = 'all' | 'last-7-days' | 'last-30-days' | 'last-90-days';

/**
 * UI state interface
 */
export interface UIState {
	/** Current view mode */
	viewMode: ViewMode;
	/** Search query text */
	searchQuery: string;
	/** Sort order preference */
	sortBy: SortBy;
	/** Date range filter */
	dateRange: DateRange;
	/** Selected folder ID for filtering (null for all/unorganized) */
	selectedFolderId: string | null;
	/** Selected tag IDs for filtering */
	selectedTagIds: string[];
}

/**
 * Default UI state
 */
const DEFAULT_STATE: UIState = {
	viewMode: 'grid',
	searchQuery: '',
	sortBy: 'newest',
	dateRange: 'all',
	selectedFolderId: null,
	selectedTagIds: []
};

/**
 * Try to load UI state from localStorage
 */
function loadFromLocalStorage(): UIState {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		if (data) {
			const parsed = JSON.parse(data);
			// Validate and merge with defaults to handle missing fields
			return {
				...DEFAULT_STATE,
				...parsed
			};
		}
	} catch (error) {
		console.error('Failed to load UI state from localStorage:', error);
	}
	return { ...DEFAULT_STATE };
}

/**
 * Try to save UI state to localStorage
 */
function saveToLocalStorage(state: UIState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.error('Failed to save UI state to localStorage:', error);
	}
}

/**
 * Create a reactive UI state store
 */
function createUIStateStore() {
	let state = $state<UIState>(loadFromLocalStorage());

	/**
	 * Set view mode
	 */
	function setViewMode(mode: ViewMode): void {
		state.viewMode = mode;
		saveToLocalStorage(state);
	}

	/**
	 * Set search query
	 */
	function setSearchQuery(query: string): void {
		state.searchQuery = query;
		// Don't persist search query to localStorage
	}

	/**
	 * Set sort order
	 */
	function setSortBy(sort: SortBy): void {
		state.sortBy = sort;
		saveToLocalStorage(state);
	}

	/**
	 * Set date range filter
	 */
	function setDateRange(range: DateRange): void {
		state.dateRange = range;
		saveToLocalStorage(state);
	}

	/**
	 * Set selected folder for filtering
	 */
	function setSelectedFolderId(folderId: string | null): void {
		state.selectedFolderId = folderId;
		// Don't persist folder selection to localStorage
	}

	/**
	 * Set selected tags for filtering
	 */
	function setSelectedTagIds(tagIds: string[]): void {
		state.selectedTagIds = tagIds;
		// Don't persist tag selection to localStorage
	}

	/**
	 * Add a tag to the selected tags
	 */
	function addSelectedTag(tagId: string): void {
		if (!state.selectedTagIds.includes(tagId)) {
			state.selectedTagIds = [...state.selectedTagIds, tagId];
		}
	}

	/**
	 * Remove a tag from the selected tags
	 */
	function removeSelectedTag(tagId: string): void {
		state.selectedTagIds = state.selectedTagIds.filter((id) => id !== tagId);
	}

	/**
	 * Toggle a tag in the selected tags
	 */
	function toggleSelectedTag(tagId: string): void {
		if (state.selectedTagIds.includes(tagId)) {
			removeSelectedTag(tagId);
		} else {
			addSelectedTag(tagId);
		}
	}

	/**
	 * Clear all filters (search, folder, tags, date range)
	 */
	function clearFilters(): void {
		state.searchQuery = '';
		state.selectedFolderId = null;
		state.selectedTagIds = [];
		state.dateRange = 'all';
		// Don't save to localStorage since these are session-specific
	}

	/**
	 * Reset all UI state to defaults
	 */
	function reset(): void {
		state = { ...DEFAULT_STATE };
		saveToLocalStorage(state);
	}

	/**
	 * Check if any filters are active
	 */
	function hasActiveFilters(): boolean {
		return (
			state.searchQuery !== '' ||
			state.selectedFolderId !== null ||
			state.selectedTagIds.length > 0 ||
			state.dateRange !== 'all'
		);
	}

	return {
		get viewMode() {
			return state.viewMode;
		},
		get searchQuery() {
			return state.searchQuery;
		},
		get sortBy() {
			return state.sortBy;
		},
		get dateRange() {
			return state.dateRange;
		},
		get selectedFolderId() {
			return state.selectedFolderId;
		},
		get selectedTagIds() {
			return state.selectedTagIds;
		},
		setViewMode,
		setSearchQuery,
		setSortBy,
		setDateRange,
		setSelectedFolderId,
		setSelectedTagIds,
		addSelectedTag,
		removeSelectedTag,
		toggleSelectedTag,
		clearFilters,
		reset,
		hasActiveFilters
	};
}

export const uiStateStore = createUIStateStore();
