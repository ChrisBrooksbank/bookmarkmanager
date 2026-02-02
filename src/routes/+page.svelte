<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';
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
	{:else}
		<div
			class="grid gap-4 {uiStateStore.viewMode === 'grid'
				? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
				: 'grid-cols-1'}"
		>
			{#each bookmarksStore.items as bookmark (bookmark.id)}
				<BookmarkCard {bookmark} />
			{/each}
		</div>
	{/if}
</div>
