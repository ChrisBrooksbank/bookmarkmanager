<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
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
				<div
					class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
				>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-2 truncate">
						{bookmark.title}
					</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
						{bookmark.url}
					</p>
					{#if bookmark.description}
						<p class="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
							{bookmark.description}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
