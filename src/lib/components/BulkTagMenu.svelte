<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { browser } from '$app/environment';

	let isOpen = $state(false);
	let isAddMode = $state(true); // true for add, false for remove

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function setMode(mode: 'add' | 'remove') {
		isAddMode = mode === 'add';
	}

	async function handleTagAction(tagId: string) {
		const selectedIds = uiStateStore.selectedBookmarkIds;
		if (selectedIds.length === 0) return;

		if (isAddMode) {
			await bookmarksStore.bulkAddTags(selectedIds, [tagId]);
		} else {
			await bookmarksStore.bulkRemoveTags(selectedIds, [tagId]);
		}
		closeDropdown();
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-bulk-tag-menu]')) {
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

<div class="relative" data-bulk-tag-menu>
	<button
		onclick={toggleDropdown}
		class="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
		aria-label="Bulk tag operations"
		aria-expanded={isOpen}
		aria-haspopup="true"
		disabled={uiStateStore.selectedBookmarkIds.length === 0}
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
			/>
		</svg>
		Manage Tags
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
			class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
		>
			<!-- Mode selector -->
			<div class="p-2 border-b border-gray-200 dark:border-gray-700">
				<div class="flex gap-2">
					<button
						onclick={() => setMode('add')}
						class="flex-1 px-3 py-2 text-sm rounded {isAddMode
							? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
							: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
					>
						Add Tags
					</button>
					<button
						onclick={() => setMode('remove')}
						class="flex-1 px-3 py-2 text-sm rounded {!isAddMode
							? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
							: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
					>
						Remove Tags
					</button>
				</div>
			</div>

			<!-- Tag list -->
			<div class="max-h-64 overflow-y-auto">
				{#if tagsStore.items.length === 0}
					<div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
						No tags available
					</div>
				{:else}
					{#each tagsStore.items as tag (tag.id)}
						<button
							onclick={() => handleTagAction(tag.id)}
							class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
						>
							{#if tag.color}
								<span class="w-3 h-3 rounded-full" style="background-color: {tag.color}"></span>
							{:else}
								<span class="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600"></span>
							{/if}
							<span class="text-gray-900 dark:text-gray-100">{tag.name}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
