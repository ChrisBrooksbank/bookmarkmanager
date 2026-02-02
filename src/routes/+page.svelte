<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';
	import BookmarkList from '$lib/components/BookmarkList.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		bookmarksStore.load();
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
	{:else if uiStateStore.viewMode === 'grid'}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each bookmarksStore.items as bookmark (bookmark.id)}
				<BookmarkCard {bookmark} />
			{/each}
		</div>
	{:else}
		<!-- List View -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
		>
			{#each bookmarksStore.items as bookmark (bookmark.id)}
				<BookmarkList {bookmark} />
			{/each}
		</div>
	{/if}
</div>
