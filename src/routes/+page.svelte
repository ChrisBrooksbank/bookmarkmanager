<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';
	import BookmarkList from '$lib/components/BookmarkList.svelte';
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
</script>

<div class="max-w-7xl mx-auto">
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
					onclick={() => uiStateStore.clearSelection()}
					class="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline"
				>
					Clear selection
				</button>
			</div>
			<div class="flex items-center gap-2">
				<BulkTagMenu />
				<BulkFolderMenu />
				<BulkDeleteButton />
			</div>
		</div>
	{/if}

	<!-- Result Count Display -->
	{#if !bookmarksStore.loading && bookmarksStore.items.length > 0 && (uiStateStore.searchQuery.trim() !== '' || uiStateStore.selectedFolderId !== null || uiStateStore.selectedTagIds.length > 0 || uiStateStore.dateRange !== 'all')}
		<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
			Showing <span class="font-semibold text-gray-900 dark:text-white"
				>{filteredBookmarks.length}</span
			>
			{filteredBookmarks.length === 1 ? 'result' : 'results'}
			{#if bookmarksStore.items.length !== filteredBookmarks.length}
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
	{:else if filteredBookmarks.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-500 dark:text-gray-400 mb-4">
				No bookmarks match the current filters
			</div>
			<p class="text-gray-400 dark:text-gray-500">
				Try adjusting your search query, folder, or tag selection
			</p>
		</div>
	{:else if uiStateStore.viewMode === 'grid'}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredBookmarks as bookmark (bookmark.id)}
				<BookmarkCard {bookmark} searchQuery={uiStateStore.searchQuery} />
			{/each}
		</div>
	{:else}
		<!-- List View -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
		>
			{#each filteredBookmarks as bookmark (bookmark.id)}
				<BookmarkList {bookmark} searchQuery={uiStateStore.searchQuery} />
			{/each}
		</div>
	{/if}
</div>
