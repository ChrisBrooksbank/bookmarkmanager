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
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

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
	/** Theme mode preference */
	themeMode: ThemeMode;
	/** Selected bookmark IDs for bulk operations */
	selectedBookmarkIds: string[];
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
	selectedTagIds: [],
	themeMode: 'system',
	selectedBookmarkIds: []
};

/**
 * Preferences that survive a reload. Search, folder/tag filters and bookmark
 * selection are session-only and must never be written to storage.
 */
type PersistedUIState = Pick<UIState, 'viewMode' | 'sortBy' | 'dateRange' | 'themeMode'>;

const VALID_VALUES: { [K in keyof PersistedUIState]: readonly PersistedUIState[K][] } = {
	viewMode: ['grid', 'list', 'compact'],
	sortBy: ['newest', 'oldest', 'alphabetical', 'recently-updated'],
	dateRange: ['all', 'last-7-days', 'last-30-days', 'last-90-days'],
	themeMode: ['light', 'dark', 'system']
};

function pickPersisted(source: Partial<Record<string, unknown>>): Partial<PersistedUIState> {
	const picked: Partial<Record<keyof PersistedUIState, unknown>> = {};
	for (const key of Object.keys(VALID_VALUES) as (keyof PersistedUIState)[]) {
		const value = source[key];
		if ((VALID_VALUES[key] as readonly unknown[]).includes(value)) {
			picked[key] = value;
		}
	}
	return picked as Partial<PersistedUIState>;
}

/**
 * Try to load UI state from localStorage
 */
function loadFromLocalStorage(): UIState {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		if (data) {
			const parsed = JSON.parse(data);
			// Only restore known preference fields with valid values
			return {
				...DEFAULT_STATE,
				...(parsed && typeof parsed === 'object' ? pickPersisted(parsed) : {})
			};
		}
	} catch (error) {
		console.error('Failed to load UI state from localStorage:', error);
	}
	return { ...DEFAULT_STATE };
}

/**
 * Try to save UI preferences to localStorage
 */
function saveToLocalStorage(state: UIState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersisted({ ...state })));
	} catch (error) {
		console.error('Failed to save UI state to localStorage:', error);
	}
}

/**
 * Create a reactive UI state store
 */
function createUIStateStore() {
	let state = $state<UIState>(loadFromLocalStorage());
	const selectedTagIdSet = $derived(new Set(state.selectedTagIds));
	const selectedBookmarkIdSet = $derived(new Set(state.selectedBookmarkIds));

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
		if (!selectedTagIdSet.has(tagId)) {
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
		if (selectedTagIdSet.has(tagId)) {
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
	 * Toggle bookmark selection
	 */
	function toggleBookmarkSelection(bookmarkId: string): void {
		if (selectedBookmarkIdSet.has(bookmarkId)) {
			state.selectedBookmarkIds = state.selectedBookmarkIds.filter((id) => id !== bookmarkId);
		} else {
			state.selectedBookmarkIds = [...state.selectedBookmarkIds, bookmarkId];
		}
	}

	/**
	 * Select multiple bookmarks
	 */
	function selectBookmarks(bookmarkIds: string[]): void {
		state.selectedBookmarkIds = [...bookmarkIds];
	}

	/**
	 * Clear all bookmark selections
	 */
	function clearSelection(): void {
		state.selectedBookmarkIds = [];
	}

	/**
	 * Select all bookmarks from a list
	 */
	function selectAll(bookmarkIds: string[]): void {
		state.selectedBookmarkIds = [...bookmarkIds];
	}

	/**
	 * Check if a bookmark is selected
	 */
	function isBookmarkSelected(bookmarkId: string): boolean {
		return selectedBookmarkIdSet.has(bookmarkId);
	}

	/**
	 * Reset all UI state to defaults
	 */
	function reset(): void {
		state = { ...DEFAULT_STATE, selectedTagIds: [], selectedBookmarkIds: [] };
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

	/**
	 * Set theme mode and apply to document
	 */
	function setThemeMode(mode: ThemeMode): void {
		state.themeMode = mode;
		saveToLocalStorage(state);
		applyTheme();
	}

	/**
	 * Apply the current theme to the document
	 */
	function applyTheme(): void {
		if (typeof window === 'undefined') return;

		const isDark =
			state.themeMode === 'dark' ||
			(state.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	/**
	 * Get the effective theme (resolved from system preference if needed)
	 */
	function getEffectiveTheme(): 'light' | 'dark' {
		if (state.themeMode === 'system') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		return state.themeMode;
	}

	/**
	 * Initialize theme on mount (call this from layout)
	 */
	function initTheme(): void {
		if (typeof window === 'undefined') return;

		// Apply theme immediately
		applyTheme();

		// Listen for system preference changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			if (state.themeMode === 'system') {
				applyTheme();
			}
		};
		mediaQuery.addEventListener('change', handleChange);
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
		get themeMode() {
			return state.themeMode;
		},
		get selectedBookmarkIds() {
			return state.selectedBookmarkIds;
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
		hasActiveFilters,
		setThemeMode,
		getEffectiveTheme,
		initTheme,
		toggleBookmarkSelection,
		selectBookmarks,
		clearSelection,
		selectAll,
		isBookmarkSelected
	};
}

export const uiStateStore = createUIStateStore();
