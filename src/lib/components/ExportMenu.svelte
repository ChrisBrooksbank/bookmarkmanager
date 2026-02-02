<script lang="ts">
	import type { Bookmark, Folder } from '$lib/types';
	import {
		downloadBookmarksHTML,
		downloadBookmarksJSON,
		downloadBookmarksCSV
	} from '$lib/utils/exportBookmarks';
	import { browser } from '$app/environment';

	let { bookmarks, folders }: { bookmarks: Bookmark[]; folders: Folder[] } = $props();

	let isOpen = $state(false);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleExportHTML() {
		const filename = `bookmarks-${new Date().toISOString().split('T')[0]}.html`;
		downloadBookmarksHTML(bookmarks, folders, filename);
		closeDropdown();
	}

	function handleExportJSON() {
		const filename = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
		downloadBookmarksJSON(bookmarks, folders, filename);
		closeDropdown();
	}

	function handleExportCSV() {
		const filename = `bookmarks-${new Date().toISOString().split('T')[0]}.csv`;
		downloadBookmarksCSV(bookmarks, folders, filename);
		closeDropdown();
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-export-menu]')) {
			closeDropdown();
		}
	}

	$effect(() => {
		if (!browser) return;

		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative" data-export-menu>
	<button
		onclick={toggleDropdown}
		class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
		aria-label="Export bookmarks"
		aria-expanded={isOpen}
		aria-haspopup="true"
		disabled={bookmarks.length === 0}
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
			/>
		</svg>
		Export
		<svg
			class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
			role="menu"
			aria-orientation="vertical"
		>
			<div class="py-1">
				<div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
					Export {bookmarks.length}
					{bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
				</div>
				<button
					onclick={handleExportHTML}
					class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3"
					role="menuitem"
				>
					<svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"
						/>
					</svg>
					<div>
						<div class="font-medium">HTML</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">Browser-compatible format</div>
					</div>
				</button>
				<button
					onclick={handleExportJSON}
					class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3"
					role="menuitem"
				>
					<svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"
						/>
					</svg>
					<div>
						<div class="font-medium">JSON</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">Full data with tags</div>
					</div>
				</button>
				<button
					onclick={handleExportCSV}
					class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3"
					role="menuitem"
				>
					<svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"
						/>
					</svg>
					<div>
						<div class="font-medium">CSV</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">Spreadsheet format</div>
					</div>
				</button>
			</div>
		</div>
	{/if}
</div>
