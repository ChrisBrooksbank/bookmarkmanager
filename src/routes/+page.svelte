<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';
	import BookmarkList from '$lib/components/BookmarkList.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		bookmarksStore.load();
	});

	/**
	 * Filter bookmarks based on selected folder and tags
	 */
	let filteredBookmarks = $derived.by(() => {
		let results = bookmarksStore.items;

		// Filter by folder if one is selected
		if (uiStateStore.selectedFolderId !== null) {
			results = results.filter((b) => b.folderId === uiStateStore.selectedFolderId);
		}

		// Filter by tags if any are selected (AND logic - bookmark must have ALL selected tags)
		if (uiStateStore.selectedTagIds.length > 0) {
			results = results.filter((bookmark) =>
				uiStateStore.selectedTagIds.every((tagId) => bookmark.tags.includes(tagId))
			);
		}

		return results;
	});
</script>

<div class="max-w-7xl mx-auto">
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
				No bookmarks match the selected filters
			</div>
			<p class="text-gray-400 dark:text-gray-500">Try adjusting your folder or tag selection</p>
		</div>
	{:else if uiStateStore.viewMode === 'grid'}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredBookmarks as bookmark (bookmark.id)}
				<BookmarkCard {bookmark} />
			{/each}
		</div>
	{:else}
		<!-- List View -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
		>
			{#each filteredBookmarks as bookmark (bookmark.id)}
				<BookmarkList {bookmark} />
			{/each}
		</div>
	{/if}
</div>
