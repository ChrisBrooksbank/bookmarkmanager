import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	createShortcutHandler,
	formatShortcut,
	getDefaultShortcuts,
	SHORTCUT_KEYS,
	isMac
} from './keyboard';

describe('keyboard utilities', () => {
	describe('createShortcutHandler', () => {
		it('should call action when matching keyboard shortcut is pressed', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'k',
					ctrl: true,
					meta: true,
					description: 'Test shortcut',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate Ctrl+K
			const event = new KeyboardEvent('keydown', {
				key: 'k',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).toHaveBeenCalledTimes(1);
		});

		it('should call action when meta key (Cmd) is pressed on Mac', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'k',
					ctrl: true,
					meta: true,
					description: 'Test shortcut',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate Cmd+K (Mac)
			const event = new KeyboardEvent('keydown', {
				key: 'k',
				metaKey: true,
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).toHaveBeenCalledTimes(1);
		});

		it('should not call action when modifier keys do not match', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'k',
					ctrl: true,
					meta: true,
					description: 'Test shortcut',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate just 'k' without modifiers
			const event = new KeyboardEvent('keydown', {
				key: 'k',
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).not.toHaveBeenCalled();
		});

		it('should handle shift modifier correctly', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'a',
					ctrl: true,
					meta: true,
					shift: true,
					description: 'Test shortcut',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate Ctrl+Shift+A
			const event = new KeyboardEvent('keydown', {
				key: 'a',
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).toHaveBeenCalledTimes(1);
		});

		it('should handle alt modifier correctly', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'f',
					alt: true,
					description: 'Test shortcut',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate Alt+F
			const event = new KeyboardEvent('keydown', {
				key: 'f',
				altKey: true,
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).toHaveBeenCalledTimes(1);
		});

		it('should handle multiple shortcuts and call only the matching one', () => {
			const action1 = vi.fn();
			const action2 = vi.fn();
			const shortcuts = [
				{
					key: 'k',
					ctrl: true,
					meta: true,
					description: 'Shortcut 1',
					action: action1
				},
				{
					key: 'n',
					ctrl: true,
					meta: true,
					description: 'Shortcut 2',
					action: action2
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate Ctrl+N
			const event = new KeyboardEvent('keydown', {
				key: 'n',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action1).not.toHaveBeenCalled();
			expect(action2).toHaveBeenCalledTimes(1);
		});

		it('should be case insensitive for key matching', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'k',
					ctrl: true,
					meta: true,
					description: 'Test shortcut',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			// Simulate Ctrl+K (uppercase)
			const event = new KeyboardEvent('keydown', {
				key: 'K',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).toHaveBeenCalledTimes(1);
		});

		it('should handle Escape key without modifiers', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'Escape',
					description: 'Close',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);

			const event = new KeyboardEvent('keydown', {
				key: 'Escape',
				bubbles: true,
				cancelable: true
			});

			handler(event);

			expect(action).toHaveBeenCalledTimes(1);
		});

		it('should prevent default when shortcut matches', () => {
			const action = vi.fn();
			const shortcuts = [
				{
					key: 'k',
					ctrl: true,
					meta: true,
					description: 'Test',
					action
				}
			];

			const handler = createShortcutHandler(shortcuts);
			const event = new KeyboardEvent('keydown', {
				key: 'k',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			});

			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

			handler(event);

			expect(preventDefaultSpy).toHaveBeenCalled();
		});
	});

	describe('formatShortcut', () => {
		beforeEach(() => {
			// Mock navigator.platform for consistent testing
			Object.defineProperty(navigator, 'platform', {
				value: 'Win32',
				writable: true,
				configurable: true
			});
		});

		it('should format Ctrl+K on Windows/Linux', () => {
			const shortcut = {
				key: 'k',
				ctrl: true,
				meta: true
			};

			const formatted = formatShortcut(shortcut);
			expect(formatted).toBe('Ctrl+K');
		});

		it('should format shortcuts with shift', () => {
			const shortcut = {
				key: 'a',
				ctrl: true,
				meta: true,
				shift: true
			};

			const formatted = formatShortcut(shortcut);
			expect(formatted).toBe('Ctrl+Shift+A');
		});

		it('should format shortcuts with alt', () => {
			const shortcut = {
				key: 'f',
				alt: true
			};

			const formatted = formatShortcut(shortcut);
			expect(formatted).toBe('Alt+F');
		});

		it('should format shortcuts without modifiers', () => {
			const shortcut = {
				key: 'Escape'
			};

			const formatted = formatShortcut(shortcut);
			expect(formatted).toBe('ESCAPE');
		});

		it('should uppercase the key', () => {
			const shortcut = {
				key: 'k',
				ctrl: true,
				meta: true
			};

			const formatted = formatShortcut(shortcut);
			expect(formatted).toContain('K');
		});
	});

	describe('isMac', () => {
		it('should return true for Mac platforms', () => {
			Object.defineProperty(navigator, 'platform', {
				value: 'MacIntel',
				writable: true,
				configurable: true
			});

			expect(isMac()).toBe(true);
		});

		it('should return false for Windows platforms', () => {
			Object.defineProperty(navigator, 'platform', {
				value: 'Win32',
				writable: true,
				configurable: true
			});

			expect(isMac()).toBe(false);
		});

		it('should return false for Linux platforms', () => {
			Object.defineProperty(navigator, 'platform', {
				value: 'Linux x86_64',
				writable: true,
				configurable: true
			});

			expect(isMac()).toBe(false);
		});
	});

	describe('getDefaultShortcuts', () => {
		it('should create shortcuts for provided actions', () => {
			const onSearch = vi.fn();
			const onAddBookmark = vi.fn();

			const shortcuts = getDefaultShortcuts({
				onSearch,
				onAddBookmark
			});

			expect(shortcuts).toHaveLength(2);
			expect(shortcuts[0].key).toBe(SHORTCUT_KEYS.SEARCH);
			expect(shortcuts[1].key).toBe(SHORTCUT_KEYS.ADD_BOOKMARK);
		});

		it('should not create shortcuts for missing actions', () => {
			const onSearch = vi.fn();

			const shortcuts = getDefaultShortcuts({
				onSearch
			});

			expect(shortcuts).toHaveLength(1);
			expect(shortcuts[0].key).toBe(SHORTCUT_KEYS.SEARCH);
		});

		it('should include descriptions for all shortcuts', () => {
			const onSearch = vi.fn();
			const onToggleView = vi.fn();

			const shortcuts = getDefaultShortcuts({
				onSearch,
				onToggleView
			});

			expect(shortcuts.every((s) => s.description.length > 0)).toBe(true);
		});

		it('should set ctrl and meta for cross-platform compatibility', () => {
			const onSearch = vi.fn();

			const shortcuts = getDefaultShortcuts({
				onSearch
			});

			const searchShortcut = shortcuts.find((s) => s.key === SHORTCUT_KEYS.SEARCH);
			expect(searchShortcut?.ctrl).toBe(true);
			expect(searchShortcut?.meta).toBe(true);
		});

		it('should create all shortcuts when all actions are provided', () => {
			const shortcuts = getDefaultShortcuts({
				onSearch: vi.fn(),
				onToggleView: vi.fn(),
				onToggleSidebar: vi.fn(),
				onAddBookmark: vi.fn(),
				onSelectAll: vi.fn(),
				onDelete: vi.fn(),
				onGridView: vi.fn(),
				onListView: vi.fn()
			});

			expect(shortcuts).toHaveLength(8);
		});

		it('should execute the correct action when triggered', () => {
			const onSearch = vi.fn();
			const onAddBookmark = vi.fn();

			const shortcuts = getDefaultShortcuts({
				onSearch,
				onAddBookmark
			});

			// Trigger the add bookmark action
			const addBookmarkShortcut = shortcuts.find((s) => s.key === SHORTCUT_KEYS.ADD_BOOKMARK);
			addBookmarkShortcut?.action();

			expect(onSearch).not.toHaveBeenCalled();
			expect(onAddBookmark).toHaveBeenCalledTimes(1);
		});
	});

	describe('SHORTCUT_KEYS', () => {
		it('should define all standard shortcut keys', () => {
			expect(SHORTCUT_KEYS.SEARCH).toBe('k');
			expect(SHORTCUT_KEYS.TOGGLE_VIEW).toBe('v');
			expect(SHORTCUT_KEYS.TOGGLE_SIDEBAR).toBe('b');
			expect(SHORTCUT_KEYS.ADD_BOOKMARK).toBe('n');
			expect(SHORTCUT_KEYS.SELECT_ALL).toBe('a');
			expect(SHORTCUT_KEYS.ESCAPE).toBe('Escape');
			expect(SHORTCUT_KEYS.DELETE).toBe('Delete');
			expect(SHORTCUT_KEYS.GRID_VIEW).toBe('1');
			expect(SHORTCUT_KEYS.LIST_VIEW).toBe('2');
		});
	});
});
