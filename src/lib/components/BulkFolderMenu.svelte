<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { browser } from '$app/environment';

	let isOpen = $state(false);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	async function handleMoveToFolder(folderId: string | null) {
		const selectedIds = uiStateStore.selectedBookmarkIds;
		if (selectedIds.length === 0) return;

		await bookmarksStore.bulkMoveToFolder(selectedIds, folderId);
		closeDropdown();
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-bulk-folder-menu]')) {
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

<div class="relative" data-bulk-folder-menu>
	<button
		onclick={toggleDropdown}
		class="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2"
		aria-label="Bulk folder operations"
		aria-expanded={isOpen}
		aria-haspopup="true"
		disabled={uiStateStore.selectedBookmarkIds.length === 0}
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
			/>
		</svg>
		Move to Folder
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
			<div class="max-h-64 overflow-y-auto">
				<!-- Unorganized option -->
				<button
					onclick={() => handleMoveToFolder(null)}
					class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
				>
					<svg
						class="w-4 h-4 text-gray-500 dark:text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					<span class="text-gray-900 dark:text-gray-100">Unorganized</span>
				</button>

				{#if foldersStore.items.length === 0}
					<div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
						No folders available
					</div>
				{:else}
					{#each foldersStore.items as folder (folder.id)}
						<button
							onclick={() => handleMoveToFolder(folder.id)}
							class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
						>
							<svg
								class="w-4 h-4 text-gray-500 dark:text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
								/>
							</svg>
							<span class="text-gray-900 dark:text-gray-100">{folder.name}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
