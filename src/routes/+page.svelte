<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';
	import BookmarkList from '$lib/components/BookmarkList.svelte';
	import CleanupDashboard from '$lib/components/CleanupDashboard.svelte';
	import BulkTagMenu from '$lib/components/BulkTagMenu.svelte';
	import BulkFolderMenu from '$lib/components/BulkFolderMenu.svelte';
	import BulkDeleteButton from '$lib/components/BulkDeleteButton.svelte';
	import { onMount, getContext } from 'svelte';
	import type { Bookmark } from '$lib/types';

	onMount(() => {
		bookmarksStore.load();
	});

	// Get filtered bookmarks from layout context
	const filteredBookmarksContext = getContext<{ bookmarks: Bookmark[] }>('filteredBookmarks');
	let filteredBookmarks = $derived(filteredBookmarksContext.bookmarks);
	let showSelectedOnly = $state(false);
	let selectedBookmarkIdSet = $derived(new Set(uiStateStore.selectedBookmarkIds));
	let displayedBookmarks = $derived(
		showSelectedOnly
			? filteredBookmarks.filter((bookmark) => selectedBookmarkIdSet.has(bookmark.id))
			: filteredBookmarks
	);

	$effect(() => {
		if (uiStateStore.selectedBookmarkIds.length === 0) {
			showSelectedOnly = false;
		}
	});

	function clearSelection() {
		showSelectedOnly = false;
		uiStateStore.clearSelection();
	}
</script>

<div class="max-w-7xl mx-auto">
	<CleanupDashboard />

	<!-- Selection Toolbar -->
	{#if uiStateStore.selectedBookmarkIds.length > 0}
		<div
			class="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
		>
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-4">
					<span class="font-semibold text-blue-900 dark:text-blue-100">
						{uiStateStore.selectedBookmarkIds.length} bookmark{uiStateStore.selectedBookmarkIds
							.length === 1
							? ''
							: 's'} selected
					</span>
					<button
						onclick={() => uiStateStore.selectAll(filteredBookmarks.map((b) => b.id))}
						class="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline"
					>
						Select all {filteredBookmarks.length}
					</button>
				</div>
				<button
					onclick={clearSelection}
					class="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline"
				>
					Clear selection
				</button>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<BulkTagMenu />
					<BulkFolderMenu />
					<BulkDeleteButton />
				</div>
				<label class="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
					<input
						type="checkbox"
						bind:checked={showSelectedOnly}
						class="w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-blue-700"
					/>
					Show selected only
					{#if showSelectedOnly}
						<span class="text-blue-700 dark:text-blue-300">({displayedBookmarks.length})</span>
					{/if}
				</label>
			</div>
		</div>
	{/if}

	<!-- Result Count Display -->
	{#if !bookmarksStore.loading && bookmarksStore.items.length > 0 && (uiStateStore.searchQuery.trim() !== '' || uiStateStore.selectedFolderId !== null || uiStateStore.selectedTagIds.length > 0 || uiStateStore.dateRange !== 'all' || showSelectedOnly)}
		<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
			Showing <span class="font-semibold text-gray-900 dark:text-white"
				>{displayedBookmarks.length}</span
			>
			{displayedBookmarks.length === 1 ? 'result' : 'results'}
			{#if showSelectedOnly}
				from selected bookmarks
			{/if}
			{#if bookmarksStore.items.length !== displayedBookmarks.length}
				of <span class="font-semibold text-gray-900 dark:text-white"
					>{bookmarksStore.items.length}</span
				>
				{bookmarksStore.items.length === 1 ? 'bookmark' : 'bookmarks'}
			{/if}
		</div>
	{/if}

	{#if bookmarksStore.loading}
		<div class="text-center py-12">
			<div class="text-gray-500 dark:text-gray-400">Loading bookmarks...</div>
		</div>
	{:else if bookmarksStore.items.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-500 dark:text-gray-400 mb-4">No bookmarks yet</div>
			<p class="text-gray-400 dark:text-gray-500">Click "Add Bookmark" to get started</p>
		</div>
	{:else if displayedBookmarks.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-500 dark:text-gray-400 mb-4">
				{showSelectedOnly
					? 'No selected bookmarks match the current filters'
					: 'No bookmarks match the current filters'}
			</div>
			<p class="text-gray-400 dark:text-gray-500">
				Try adjusting your search query, folder, tag selection, or selected-only view
			</p>
		</div>
	{:else if uiStateStore.viewMode === 'grid'}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each displayedBookmarks as bookmark (bookmark.id)}
				<BookmarkCard {bookmark} searchQuery={uiStateStore.searchQuery} />
			{/each}
		</div>
	{:else}
		<!-- List View -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
		>
			{#each displayedBookmarks as bookmark (bookmark.id)}
				<BookmarkList {bookmark} searchQuery={uiStateStore.searchQuery} />
			{/each}
		</div>
	{/if}
</div>
