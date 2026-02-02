/**
 * Keyboard shortcuts utility for BookmarkVault
 * Provides a centralized system for managing keyboard shortcuts
 */

export type KeyboardShortcut = {
	key: string;
	ctrl?: boolean;
	meta?: boolean; // Cmd on Mac
	shift?: boolean;
	alt?: boolean;
	description: string;
	action: () => void;
};

export type ShortcutHandler = (event: KeyboardEvent) => void;

/**
 * Creates a keyboard shortcut handler
 */
export function createShortcutHandler(shortcuts: KeyboardShortcut[]): ShortcutHandler {
	return (event: KeyboardEvent) => {
		// Don't intercept shortcuts when user is in an input field
		const activeElement = document.activeElement;
		const isInInput =
			activeElement instanceof HTMLInputElement ||
			activeElement instanceof HTMLTextAreaElement ||
			activeElement?.getAttribute('contenteditable') === 'true';
		if (isInInput) {
			return;
		}

		for (const shortcut of shortcuts) {
			// Check if the key matches
			if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
				continue;
			}

			// Check modifier keys
			const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
			const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
			const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
			const altMatch = shortcut.alt ? event.altKey : !event.altKey;

			// For shortcuts with ctrl/meta, we accept either one (cross-platform)
			// This allows Ctrl on Windows/Linux and Cmd on Mac to work interchangeably
			const modifierMatch =
				shortcut.ctrl || shortcut.meta
					? (event.ctrlKey || event.metaKey) && shiftMatch && altMatch
					: ctrlMatch && metaMatch && shiftMatch && altMatch;

			if (modifierMatch) {
				event.preventDefault();
				shortcut.action();
				break;
			}
		}
	};
}

/**
 * Checks if the user is on macOS
 */
export function isMac(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
}

/**
 * Formats a keyboard shortcut for display
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): string {
	const parts: string[] = [];
	const mac = isMac();

	if (shortcut.ctrl || shortcut.meta) {
		parts.push(mac ? '⌘' : 'Ctrl');
	}
	if (shortcut.shift) {
		parts.push(mac ? '⇧' : 'Shift');
	}
	if (shortcut.alt) {
		parts.push(mac ? '⌥' : 'Alt');
	}
	parts.push(shortcut.key.toUpperCase());

	return parts.join(mac ? '' : '+');
}

/**
 * Common keyboard shortcuts used throughout the app
 */
export const SHORTCUT_KEYS = {
	// Navigation & UI
	SEARCH: 'k',
	TOGGLE_SIDEBAR: 'b',
	ADD_BOOKMARK: 'n',

	// Bulk operations
	SELECT_ALL: 'a',
	ESCAPE: 'Escape',
	DELETE: 'Delete',

	// View modes
	GRID_VIEW: '1',
	LIST_VIEW: '2'
} as const;

/**
 * Default keyboard shortcuts for the app
 */
export function getDefaultShortcuts(actions: {
	onSearch?: () => void;
	onToggleSidebar?: () => void;
	onAddBookmark?: () => void;
	onSelectAll?: () => void;
	onDelete?: () => void;
	onGridView?: () => void;
	onListView?: () => void;
}): KeyboardShortcut[] {
	const shortcuts: KeyboardShortcut[] = [];

	if (actions.onSearch) {
		shortcuts.push({
			key: SHORTCUT_KEYS.SEARCH,
			ctrl: true,
			meta: true,
			description: 'Focus search',
			action: actions.onSearch
		});
	}

	if (actions.onToggleSidebar) {
		shortcuts.push({
			key: SHORTCUT_KEYS.TOGGLE_SIDEBAR,
			ctrl: true,
			meta: true,
			description: 'Toggle sidebar',
			action: actions.onToggleSidebar
		});
	}

	if (actions.onAddBookmark) {
		shortcuts.push({
			key: SHORTCUT_KEYS.ADD_BOOKMARK,
			ctrl: true,
			meta: true,
			description: 'Add new bookmark',
			action: actions.onAddBookmark
		});
	}

	if (actions.onSelectAll) {
		shortcuts.push({
			key: SHORTCUT_KEYS.SELECT_ALL,
			ctrl: true,
			meta: true,
			description: 'Select all bookmarks',
			action: actions.onSelectAll
		});
	}

	if (actions.onDelete) {
		shortcuts.push({
			key: SHORTCUT_KEYS.DELETE,
			description: 'Delete selected bookmarks',
			action: actions.onDelete
		});
	}

	if (actions.onGridView) {
		shortcuts.push({
			key: SHORTCUT_KEYS.GRID_VIEW,
			ctrl: true,
			meta: true,
			description: 'Switch to grid view',
			action: actions.onGridView
		});
	}

	if (actions.onListView) {
		shortcuts.push({
			key: SHORTCUT_KEYS.LIST_VIEW,
			ctrl: true,
			meta: true,
			description: 'Switch to list view',
			action: actions.onListView
		});
	}

	return shortcuts;
}
